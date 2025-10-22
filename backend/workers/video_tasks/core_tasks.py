"""
Core Celery task definitions for video processing
"""

import logging
import uuid
from typing import Dict, Any

from backend.workers.celery_app import app
from backend.models.user import User
from backend.models.job import VideoJob, JobStatus
from backend.workers.video_tasks.helpers import get_db, create_status_history
from backend.workers.video_tasks.status_updates import (
    create_progress_callback,
    send_completion_notification_sync,
    send_failure_notification_sync
)
from backend.workers.video_tasks.processing import (
    upload_video_to_s3,
    submit_to_ghostcut,
    poll_ghostcut_task,
    finalize_processed_video,
    cleanup_job_files,
    cleanup_expired_files
)
from backend.workers.video_tasks.monitoring import (
    check_long_running_jobs_sync,
    update_processing_jobs_status_sync,
    update_user_quotas_sync
)
from backend.workers.video_tasks.pro_jobs import check_pro_job_completion_sync

logger = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3)
def process_video(self, job_id: str) -> Dict[str, Any]:
    """
    Main video processing task - integrates with existing video_processing.py
    """
    db = get_db()
    try:
        # Get job from database
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return {"success": False, "error": "Job not found"}

        # Get user
        user = db.query(User).filter(User.id == job.user_id).first()
        if not user:
            logger.error(f"User {job.user_id} not found for job {job_id}")
            return {"success": False, "error": "User not found"}

        # Update job status to processing
        job.update_status(JobStatus.PROCESSING, "Starting video processing")
        create_status_history(
            db,
            job,
            JobStatus.QUEUED.value,
            JobStatus.PROCESSING.value,
            "Processing started"
        )
        db.commit()

        # Create progress callback
        progress_callback = create_progress_callback(db, job, user, self)

        progress_callback(10, "Validating video file")

        # Get input file
        input_file = job.get_input_file()
        if not input_file:
            raise Exception("Input file not found")

        # Upload to S3 and get public URL
        video_url = upload_video_to_s3(input_file, progress_callback)

        # Submit to Ghostcut API
        result = submit_to_ghostcut(video_url, job, db, progress_callback)

        if result and result.get('task_id'):
            job.zhaoli_task_id = result['task_id']
            db.commit()

            progress_callback(50, "Processing on Ghostcut servers")

            # Poll for completion
            success = poll_ghostcut_completion.delay(
                job_id,
                result['task_id']
            ).get(timeout=1800)  # 30 minute timeout

            if success:
                # Get output file path
                output_file = job.get_output_file()
                if output_file:
                    output_path = output_file.storage_path

                    # Finalize processing
                    finalize_processed_video(
                        job,
                        user,
                        output_path,
                        db,
                        progress_callback
                    )

                    # Update job status
                    job.update_status(JobStatus.COMPLETED, "Video processing completed")
                    create_status_history(
                        db,
                        job,
                        JobStatus.PROCESSING.value,
                        JobStatus.COMPLETED.value,
                        "Processing completed"
                    )
                    db.commit()

                    # Send completion notification
                    send_completion_notification.delay(str(user.id), job_id)

                    # Schedule cleanup
                    cleanup_job.apply_async(args=[job_id], countdown=3600)

                    return {"success": True, "output_path": output_path}
                else:
                    raise Exception("Output file not found after processing")
            else:
                raise Exception("Ghostcut processing failed or timed out")
        else:
            raise Exception("Failed to submit job to Ghostcut API")

    except Exception as exc:
        logger.error(f"Video processing failed for job {job_id}: {exc}")

        # Update job status to failed
        try:
            job.update_status(JobStatus.FAILED, str(exc))
            create_status_history(
                db,
                job,
                job.status,
                JobStatus.FAILED.value,
                f"Processing failed: {str(exc)}"
            )
            db.commit()

            # Send failure notification
            send_failure_notification.delay(str(user.id), job_id, str(exc))

        except Exception as db_error:
            logger.error(f"Failed to update job status: {db_error}")

        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        else:
            return {"success": False, "error": str(exc)}

    finally:
        db.close()


@app.task(bind=True, max_retries=3)
def poll_ghostcut_completion(self, job_id: str, ghostcut_task_id: str) -> bool:
    """
    Poll Ghostcut API for completion status
    """
    try:
        success = poll_ghostcut_task(job_id, ghostcut_task_id)
        return success
    except Exception as exc:
        logger.error(f"Error polling Ghostcut status: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60)
        return False


@app.task
def cleanup_job(job_id: str) -> None:
    """
    Clean up temporary files for a job
    """
    cleanup_job_files(job_id)


@app.task
def cleanup_expired_files_task() -> None:
    """
    Periodic task to clean up expired files
    """
    cleanup_expired_files()


@app.task
def send_completion_notification(user_id: str, job_id: str) -> None:
    """
    Send notification when job is completed
    """
    send_completion_notification_sync(user_id, job_id)


@app.task
def send_failure_notification(user_id: str, job_id: str, error_message: str) -> None:
    """
    Send notification when job fails
    """
    send_failure_notification_sync(user_id, job_id, error_message)


@app.task
def update_user_quotas() -> None:
    """
    Daily task to update user credit quotas based on subscription
    """
    update_user_quotas_sync()


@app.task
def check_long_running_jobs() -> None:
    """
    Check for jobs that have been running too long
    """
    check_long_running_jobs_sync()


@app.task
def update_processing_jobs_status() -> None:
    """
    Periodic task to update status of all processing jobs
    """
    update_processing_jobs_status_sync()


@app.task
def check_pro_job_completion() -> None:
    """
    Periodic task to check completion status of Pro video jobs (Sync.so)
    """
    check_pro_job_completion_sync()


def queue_video_processing_job(job_id: str):
    """
    Queue a video processing job
    """
    return process_video.delay(job_id)
