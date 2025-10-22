"""
Job monitoring and status checking tasks
"""

import logging
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from backend.models.user import User, SubscriptionTier, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.config import settings
from backend.workers.video_tasks.helpers import get_db, create_status_history
from backend.workers.video_tasks.status_updates import (
    send_completion_notification_sync,
    send_failure_notification_sync
)

logger = logging.getLogger(__name__)


def check_long_running_jobs_sync() -> None:
    """
    Check for jobs that have been running too long and verify their status
    with Zhaoli API before marking them as failed
    """
    db = get_db()
    try:
        timeout_minutes = settings.default_processing_timeout_minutes
        timeout_time = datetime.utcnow() - timedelta(minutes=timeout_minutes)

        long_running_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.started_at < timeout_time
        ).all()

        actually_failed_jobs = []

        for job in long_running_jobs:
            if verify_job_with_api(job, db):
                continue  # Job is still processing or completed

            # If we reach here, the job is genuinely stuck or failed
            job.update_status(
                JobStatus.FAILED,
                f"Job timed out after {timeout_minutes} minutes (verified with API)"
            )
            create_status_history(
                db,
                job,
                JobStatus.PROCESSING.value,
                JobStatus.FAILED.value,
                "Job timed out (API verified)"
            )
            actually_failed_jobs.append(job)

            # Send failure notification
            send_failure_notification_sync(
                str(job.user_id),
                str(job.id),
                f"Job timed out after {timeout_minutes} minutes"
            )

        db.commit()

        if actually_failed_jobs:
            logger.info(
                f"Marked {len(actually_failed_jobs)} truly long-running "
                f"jobs as failed"
            )
        if long_running_jobs:
            logger.info(
                f"Checked {len(long_running_jobs)} long-running jobs, "
                f"{len(actually_failed_jobs)} actually failed"
            )

    except Exception as e:
        logger.error(f"Error checking long-running jobs: {e}")
    finally:
        db.close()


def verify_job_with_api(job: VideoJob, db: Session) -> bool:
    """
    Verify job status with Zhaoli API
    Returns True if job is still processing or completed
    """
    if not job.zhaoli_task_id:
        return False

    try:
        from backend.services.ghostcut_client import GhostCutClient
        client = GhostCutClient(
            app_key=settings.ghostcut_api_key,
            app_secret=settings.ghostcut_app_secret,
            api_url=settings.ghostcut_api_url
        )

        status_result = client.get_job_status(job.zhaoli_task_id)

        if status_result.get('status') == 'processing':
            # Job is still actively processing, update progress and continue
            progress = status_result.get('progress', 0)
            message = status_result.get('message', 'Still processing...')

            job.progress_percentage = progress
            job.progress_message = f"Long-running job still in progress: {message}"
            logger.info(f"Job {job.id} is still processing at {progress}%")
            return True

        elif status_result.get('status') == 'completed':
            # Job actually completed, update status
            job.update_status(
                JobStatus.COMPLETED,
                "Processing completed (detected during timeout check)"
            )
            create_status_history(
                db,
                job,
                JobStatus.PROCESSING.value,
                JobStatus.COMPLETED.value,
                "Completed during timeout check"
            )
            return True

    except Exception as api_error:
        logger.warning(
            f"Could not check Zhaoli status for job {job.id}: {api_error}"
        )

    return False


def update_processing_jobs_status_sync() -> None:
    """
    Periodic task to update status of all processing jobs by checking
    with Zhaoli API. This prevents frontend timeout issues.
    """
    db = get_db()
    try:
        processing_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.zhaoli_task_id.isnot(None)
        ).all()

        updated_count = 0
        completed_count = 0

        for job in processing_jobs:
            try:
                result = update_single_job_status(job, db)
                if result == 'updated':
                    updated_count += 1
                elif result == 'completed':
                    completed_count += 1
            except Exception as api_error:
                logger.warning(f"Could not update status for job {job.id}: {api_error}")
                continue

        db.commit()

        if updated_count > 0 or completed_count > 0:
            logger.info(
                f"Updated {updated_count} processing jobs, "
                f"{completed_count} completed"
            )

    except Exception as e:
        logger.error(f"Error updating processing jobs status: {e}")
    finally:
        db.close()


def update_single_job_status(job: VideoJob, db: Session) -> str:
    """
    Update a single job's status from Zhaoli API
    Returns: 'updated', 'completed', 'failed', or 'unchanged'
    """
    from backend.services.ghostcut_client import GhostCutClient

    client = GhostCutClient(
        app_key=settings.ghostcut_api_key,
        app_secret=settings.ghostcut_app_secret,
        api_url=settings.ghostcut_api_url
    )

    status_result = client.get_job_status(job.zhaoli_task_id)

    if status_result.get('status') == 'completed':
        # Job completed, update status
        job.update_status(JobStatus.COMPLETED, "Processing completed successfully")
        create_status_history(
            db,
            job,
            JobStatus.PROCESSING.value,
            JobStatus.COMPLETED.value,
            "Completed (auto-detected)"
        )

        # Send completion notification
        send_completion_notification_sync(str(job.user_id), str(job.id))
        return 'completed'

    elif status_result.get('status') == 'processing':
        # Update progress information
        progress = status_result.get('progress', job.progress_percentage or 0)
        message = status_result.get('message', 'Processing...')

        job.progress_percentage = progress
        job.progress_message = message
        return 'updated'

    elif status_result.get('status') == 'error':
        # Job failed
        error_msg = status_result.get('error', 'Unknown error from Zhaoli API')
        job.update_status(JobStatus.FAILED, error_msg)
        create_status_history(
            db,
            job,
            JobStatus.PROCESSING.value,
            JobStatus.FAILED.value,
            f"Failed: {error_msg}"
        )

        # Send failure notification
        send_failure_notification_sync(str(job.user_id), str(job.id), error_msg)
        return 'failed'

    return 'unchanged'


def update_user_quotas_sync() -> None:
    """
    Daily task to update user credit quotas based on subscription
    """
    db = get_db()
    try:
        # Get all active users with subscription tiers
        users = db.query(User).join(SubscriptionTier).filter(
            User.status == "active",
            SubscriptionTier.is_active == True
        ).all()

        for user in users:
            if user.subscription_tier.credits_per_month > 0:
                # Add monthly credits
                user.credits_balance += user.subscription_tier.credits_per_month

                # Record transaction
                transaction = CreditTransaction(
                    user_id=user.id,
                    transaction_type="bonus",
                    amount=user.subscription_tier.credits_per_month,
                    balance_after=user.credits_balance,
                    description=(
                        f"Monthly credit allocation: "
                        f"{user.subscription_tier.display_name}"
                    ),
                    reference_type="subscription",
                    reference_id=str(user.subscription_tier.id)
                )
                db.add(transaction)

        db.commit()
        logger.info(f"Updated quotas for {len(users)} users")

    except Exception as e:
        logger.error(f"Error updating user quotas: {e}")
    finally:
        db.close()
