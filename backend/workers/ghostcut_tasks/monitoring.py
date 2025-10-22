"""
GhostCut job monitoring and status checking
"""

import logging
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File, FileType
from backend.config import settings
from backend.services.ghostcut import GhostCutClient
from backend.workers.ghostcut_tasks.helpers import (
    get_db,
    send_progress_update,
    download_processed_video
)

logger = logging.getLogger(__name__)


def check_ghostcut_completion_sync() -> None:
    """
    Periodic task to check if any processing jobs have been completed in GhostCut
    This runs every 2 minutes to catch jobs that may have been completed
    """
    db = get_db()
    try:
        # Get all jobs that are still in processing state with zhaoli task IDs
        processing_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.zhaoli_task_id.isnot(None)
        ).all()

        logger.info(
            f"Checking completion status for {len(processing_jobs)} processing jobs"
        )

        for job in processing_jobs:
            try:
                check_single_job_completion(job, db)
            except Exception as e:
                logger.error(f"Error checking job {job.id} completion: {e}")
                continue

        logger.info(f"Completed checking {len(processing_jobs)} jobs")

    except Exception as e:
        logger.error(f"Error in check_ghostcut_completion: {e}")
    finally:
        db.close()


def check_single_job_completion(job: VideoJob, db: Session) -> None:
    """
    Check completion status of a single job
    """
    # Initialize GhostCut client
    ghostcut_client = GhostCutClient(
        api_key=settings.ghostcut_api_key,
        api_secret=settings.ghostcut_app_secret,
        api_url=settings.ghostcut_api_url or "https://api.zhaoli.com"
    )

    # Check job status
    status_response = ghostcut_client.get_job_status(str(job.zhaoli_task_id))
    logger.info(f"Job {job.id} status check: {status_response}")

    if status_response["status"] == "completed":
        handle_job_completed(job, status_response, db)
    elif status_response["status"] == "failed":
        handle_job_failed(job, status_response, db)
    else:
        handle_job_still_processing(job, status_response, db)


def handle_job_completed(
    job: VideoJob,
    status_response: dict,
    db: Session
) -> None:
    """
    Handle a completed job
    """
    output_url = status_response.get("output_url")
    if not output_url:
        return

    logger.info(f"Job {job.id} completed! Processing result...")

    # Get user for this job
    user = db.query(User).filter(User.id == job.user_id).first()
    if not user:
        logger.error(f"User {job.user_id} not found for job {job.id}")
        return

    # Download the processed video
    output_path = download_processed_video(output_url, str(job.id))

    # Create output file record
    output_file = File(
        id=uuid.uuid4(),
        user_id=user.id,
        filename=f"ghostcut_output_{job.id}.mp4",
        file_type=FileType.OUTPUT_VIDEO,
        file_size_bytes=os.path.getsize(output_path),
        storage_path=output_path,
        mime_type="video/mp4",
        is_public=False
    )
    db.add(output_file)

    # Update job to completed
    job.status = JobStatus.COMPLETED.value
    job.completed_at = datetime.utcnow()
    job.progress_percentage = 100
    job.progress_message = "Processing completed successfully"
    job.output_file_id = output_file.id

    # Deduct credits
    credits_used = job.estimated_credits or 10
    job.actual_credits_used = credits_used
    user.credits_balance -= credits_used

    # Create credit transaction
    transaction = CreditTransaction(
        id=uuid.uuid4(),
        user_id=user.id,
        amount=-credits_used,
        balance_after=user.credits_balance,
        description=f"GhostCut processing job {job.id}",
        job_id=job.id
    )
    db.add(transaction)

    db.commit()

    # Send completion notification
    send_progress_update(user, job, 100, "Processing completed successfully")

    logger.info(f"Successfully completed job {job.id}")


def handle_job_failed(
    job: VideoJob,
    status_response: dict,
    db: Session
) -> None:
    """
    Handle a failed job
    """
    # Only mark as failed if it's a real failure, not timeout
    error_message = status_response.get("error", "Processing failed")
    if not any(word in error_message.lower() for word in ['timeout', 'timed out']):
        job.status = JobStatus.FAILED.value
        job.error_message = error_message
        job.completed_at = datetime.utcnow()
        db.commit()
        logger.warning(f"Job {job.id} failed: {error_message}")


def handle_job_still_processing(
    job: VideoJob,
    status_response: dict,
    db: Session
) -> None:
    """
    Handle a job that is still processing
    """
    # Still processing - update progress if available
    progress = status_response.get("progress", job.progress_percentage or 20)
    message = status_response.get("message", "Processing continues...")

    if progress > job.progress_percentage:
        job.progress_percentage = progress
        job.progress_message = message
        db.commit()

        # Send progress update
        user = db.query(User).filter(User.id == job.user_id).first()
        if user:
            send_progress_update(user, job, progress, message)
