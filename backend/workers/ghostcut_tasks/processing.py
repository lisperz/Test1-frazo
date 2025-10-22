"""
GhostCut video processing logic
"""

import logging
import os
import uuid
import time
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File, FileType
from backend.config import settings
from backend.services.ghostcut import GhostCutClient
from backend.services.s3 import s3_service
from backend.workers.ghostcut_tasks.helpers import (
    send_progress_update,
    download_processed_video,
    calculate_progress_with_time,
    get_sleep_interval
)

logger = logging.getLogger(__name__)


def validate_job_input(job: VideoJob) -> str:
    """
    Validate job input and return local video path
    """
    config = job.processing_config
    local_video_path = config.get("local_video_path")

    if not local_video_path:
        raise ValueError("No local video path provided")

    if not os.path.exists(local_video_path):
        raise ValueError(f"Video file does not exist: {local_video_path}")

    return local_video_path


def upload_video_to_s3(
    user: User,
    job: VideoJob,
    local_video_path: str,
    db: Session
) -> str:
    """
    Upload video to S3 and return public URL
    """
    send_progress_update(user, job, 5, "Uploading video to S3...")

    # Generate S3 key with user and job info
    filename = os.path.basename(local_video_path)
    s3_key = f"users/{user.id}/jobs/{job.id}/{filename}"

    video_url = s3_service.upload_video_and_get_url(local_video_path, s3_key)

    if not video_url:
        raise ValueError("Failed to upload video to S3")

    logger.info(f"Video uploaded to S3: {video_url}")

    # Store S3 URL in job metadata
    if not job.job_metadata:
        job.job_metadata = {}
    job.job_metadata["s3_video_url"] = video_url
    job.job_metadata["s3_key"] = s3_key
    db.commit()

    return video_url


def submit_ghostcut_job(
    user: User,
    job: VideoJob,
    video_url: str,
    db: Session
) -> str:
    """
    Submit job to GhostCut API and return job ID
    """
    send_progress_update(user, job, 15, "Submitting to Zhaoli API for text inpainting...")

    # Extract processing config
    config = job.processing_config
    language = config.get("language", "auto")
    erasures = config.get("erasures", [])
    protected_areas = config.get("protected_areas", [])
    text_areas = config.get("text_areas", [])
    auto_detect_text = config.get("auto_detect_text", False)

    # Initialize GhostCut client
    ghostcut_client = GhostCutClient(
        api_key=settings.ghostcut_api_key,
        api_secret=settings.ghostcut_app_secret,
        api_url=settings.ghostcut_api_url or "https://api.zhaoli.com"
    )

    # Submit job to Zhaoli API
    ghostcut_job_id = ghostcut_client.submit_job(
        video_url=video_url,
        ghostcut_uid=settings.ghostcut_uid,
        language=language,
        erasures=erasures,
        protected_areas=protected_areas,
        text_areas=text_areas,
        auto_detect_text=auto_detect_text
    )

    # Store GhostCut job ID
    job.zhaoli_task_id = ghostcut_job_id
    db.commit()

    send_progress_update(user, job, 20, "Job submitted, waiting for processing")

    return ghostcut_job_id


def poll_ghostcut_status(
    user: User,
    job: VideoJob,
    ghostcut_job_id: str,
    job_id: str,
    db: Session
) -> Dict[str, Any]:
    """
    Poll GhostCut API until job completes or fails
    """
    # Initialize GhostCut client
    ghostcut_client = GhostCutClient(
        api_key=settings.ghostcut_api_key,
        api_secret=settings.ghostcut_app_secret,
        api_url=settings.ghostcut_api_url or "https://api.zhaoli.com"
    )

    attempt = 0

    while True:  # Poll indefinitely until completion or failure
        # Check job status
        status_response = ghostcut_client.get_job_status(ghostcut_job_id)

        if status_response["status"] == "completed":
            return handle_completed_status(
                user,
                job,
                status_response,
                job_id,
                db
            )

        elif status_response["status"] == "failed":
            error_message = status_response.get("error", "Unknown error")
            raise Exception(f"GhostCut processing failed: {error_message}")

        else:
            # Still processing
            attempt += 1
            handle_processing_status(
                user,
                job,
                status_response,
                attempt,
                db
            )

        # Wait before next poll
        time.sleep(get_sleep_interval(attempt))


def handle_completed_status(
    user: User,
    job: VideoJob,
    status_response: Dict[str, Any],
    job_id: str,
    db: Session
) -> Dict[str, Any]:
    """
    Handle completed job status
    """
    output_url = status_response.get("output_url")
    if not output_url:
        raise ValueError("No output URL returned from GhostCut")

    send_progress_update(user, job, 90, "Processing complete, saving result")

    # Download the processed video
    output_path = download_processed_video(output_url, job_id)

    # Create output file record
    output_file = File(
        id=uuid.uuid4(),
        user_id=user.id,
        filename=f"ghostcut_output_{job_id}.mp4",
        file_type=FileType.OUTPUT_VIDEO,
        file_size_bytes=os.path.getsize(output_path),
        storage_path=output_path,
        mime_type="video/mp4",
        is_public=False
    )
    db.add(output_file)

    # Update job
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
        description=f"GhostCut processing job {job_id}",
        job_id=job.id
    )
    db.add(transaction)

    db.commit()

    send_progress_update(user, job, 100, "Processing completed successfully")

    logger.info(f"GhostCut job {job_id} completed successfully")
    return {"success": True, "output_file_id": str(output_file.id)}


def handle_processing_status(
    user: User,
    job: VideoJob,
    status_response: Dict[str, Any],
    attempt: int,
    db: Session
) -> None:
    """
    Handle in-progress job status
    """
    base_progress = status_response.get("progress", 20)
    progress, message = calculate_progress_with_time(base_progress, attempt)

    send_progress_update(user, job, progress, message)

    job.progress_percentage = progress
    job.progress_message = message
    db.commit()


def handle_error_with_retry(
    error_message: str,
    job: VideoJob,
    job_id: str,
    db: Session
) -> tuple[bool, str]:
    """
    Determine if error should trigger retry or failure
    Returns: (should_keep_processing, action_type)
    """
    # Check if this is a timeout or temporary error
    if 'timeout' in error_message.lower() or 'timed out' in error_message.lower():
        logger.info(f"Job {job_id} encountered timeout, keeping in processing state")
        job.progress_message = "Processing continues..."
        db.commit()
        return True, 'timeout'

    # Only mark as failed for actual failures (not timeouts)
    if 'failed' in error_message.lower() or 'error' in error_message.lower():
        job.status = JobStatus.FAILED.value
        job.error_message = error_message
        job.completed_at = datetime.utcnow()
        db.commit()
        return False, 'failed'

    # For any other errors, keep in processing state
    logger.warning(f"Job {job_id} error but keeping in processing: {error_message}")
    job.progress_message = "Processing continues..."
    db.commit()
    return True, 'keep_processing'
