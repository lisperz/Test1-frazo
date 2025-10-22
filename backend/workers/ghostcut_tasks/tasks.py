"""
Celery task definitions for GhostCut video processing
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from backend.workers.celery_app import app
from backend.models.user import User
from backend.models.job import VideoJob, JobStatus
from backend.workers.ghostcut_tasks.helpers import (
    get_db,
    send_progress_update
)
from backend.workers.ghostcut_tasks.processing import (
    validate_job_input,
    upload_video_to_s3,
    submit_ghostcut_job,
    poll_ghostcut_status,
    handle_error_with_retry
)
from backend.workers.ghostcut_tasks.monitoring import (
    check_ghostcut_completion_sync
)

logger = logging.getLogger(__name__)


@app.task(
    bind=True,
    max_retries=3,
    queue='video_processing',
    routing_key='video_processing'
)
def process_ghostcut_video(self, job_id: str) -> Dict[str, Any]:
    """
    Process video using GhostCut API for text inpainting
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
        job.status = JobStatus.PROCESSING.value
        job.started_at = datetime.utcnow()
        job.progress_percentage = 0
        job.progress_message = "Initializing GhostCut processing"
        db.commit()

        # Send WebSocket update
        send_progress_update(user, job, 0, "Starting GhostCut processing")

        # Validate input
        local_video_path = validate_job_input(job)

        # Upload to S3
        video_url = upload_video_to_s3(user, job, local_video_path, db)

        # Submit to GhostCut API
        ghostcut_job_id = submit_ghostcut_job(user, job, video_url, db)

        # Poll for completion
        result = poll_ghostcut_status(user, job, ghostcut_job_id, job_id, db)

        return result

    except Exception as e:
        logger.error(f"Error processing GhostCut job {job_id}: {e}", exc_info=True)

        error_message = str(e)

        # Handle error with retry logic
        should_keep_processing, action_type = handle_error_with_retry(
            error_message,
            job,
            job_id,
            db
        )

        if action_type == 'timeout':
            # Continue retrying silently for timeouts
            if self.request.retries < self.max_retries:
                logger.info(
                    f"Silently retrying GhostCut job {job_id}, "
                    f"attempt {self.request.retries + 1}"
                )
                raise self.retry(countdown=60 * (self.request.retries + 1))

            # Even after max retries, keep job in processing state
            return {"success": False, "error": "Processing continues", "silent": True}

        elif action_type == 'failed':
            # Send failure notification
            send_progress_update(user, job, 0, f"Processing failed: {e}")

        # Retry if retries available
        if self.request.retries < self.max_retries:
            logger.info(
                f"Retrying GhostCut job {job_id}, "
                f"attempt {self.request.retries + 1}"
            )
            raise self.retry(countdown=60 * (self.request.retries + 1))

        return {"success": False, "error": str(e)}

    finally:
        db.close()


@app.task
def check_ghostcut_completion() -> None:
    """
    Periodic task to check if any processing jobs have been completed in GhostCut
    This runs every 2 minutes to catch jobs that may have been completed
    """
    check_ghostcut_completion_sync()
