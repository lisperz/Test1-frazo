"""
Utility functions for direct_process routes
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)



async def process_video_immediately(
    job_id: str,
    file_path: str,
    db: Session,
    background_tasks: BackgroundTasks
):
    """
    Process video immediately without Celery
    """

    try:
        # Get job and user
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        user = db.query(User).filter(User.id == job.user_id).first()

        # Update status to processing
        job.status = JobStatus.PROCESSING.value
        job.started_at = datetime.datetime.now(datetime.timezone.utc)
        job.progress_percentage = 10
        job.progress_message = "Uploading to cloud storage..."
        db.commit()

        # Upload to S3 immediately
        filename = os.path.basename(file_path)
        s3_key = f"users/{user.id}/jobs/{job.id}/{filename}"

        logger.info(f"Uploading to S3: {s3_key}")
        video_url = s3_service.upload_video_and_get_url(file_path, s3_key)

        if not video_url:
            raise ValueError("Failed to upload video to S3")

        # Update progress
        job.progress_percentage = 30
        job.progress_message = "Submitting to AI processing..."
        job.job_metadata = {"s3_video_url": video_url, "s3_key": s3_key}
        db.commit()

        # Call GhostCut API immediately with effects data
        job_effects = job.processing_config.get('effects_data', [])
        ghostcut_task_id = await call_ghostcut_api_async(video_url, job_id, job_effects)

        # Update job with GhostCut task ID
        job.zhaoli_task_id = ghostcut_task_id
        job.progress_percentage = 50
        job.progress_message = "AI processing started successfully"
        db.commit()

        logger.info(f"Video {job_id} sent to GhostCut immediately with task ID: {ghostcut_task_id}")

        # Start background monitoring (non-blocking)
        background_tasks.add_task(monitor_ghostcut_status, job_id, ghostcut_task_id)

        return ghostcut_task_id

    except Exception as e:
        logger.error(f"Error processing video {job_id}: {e}")
        job.status = JobStatus.FAILED.value
        job.error_message = str(e)
        job.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        raise

