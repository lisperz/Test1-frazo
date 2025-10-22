"""
Helper functions for GhostCut task processing
"""

import logging
import os
import requests
from typing import Optional

from backend.config import settings
from backend.models.user import User
from backend.models.job import VideoJob

logger = logging.getLogger(__name__)


def get_db():
    """Get database session"""
    from backend.models.database import SessionLocal
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session will be closed in finally block of calling function


def send_progress_update(user: User, job: VideoJob, progress: int, message: str):
    """Send WebSocket progress update"""
    try:
        from backend.api.websocket import send_job_update
        # job.status is already a string, no need to access .value
        status = job.status if isinstance(job.status, str) else job.status.value
        send_job_update(str(user.id), str(job.id), {
            "progress": progress,
            "message": message,
            "status": status
        })
    except Exception as e:
        logger.error(f"Failed to send WebSocket update: {e}")


def download_processed_video(url: str, job_id: str) -> str:
    """Download processed video from GhostCut"""
    try:
        # Create output directory
        output_dir = os.path.join(settings.upload_path, "ghostcut_outputs")
        os.makedirs(output_dir, exist_ok=True)

        # Download file
        output_path = os.path.join(output_dir, f"ghostcut_{job_id}.mp4")

        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        logger.info(f"Downloaded processed video to {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Failed to download processed video: {e}")
        raise


def calculate_progress_with_time(
    base_progress: int,
    attempt: int
) -> tuple[int, str]:
    """
    Calculate progress and message based on elapsed time
    Returns: (progress_percentage, status_message)
    """
    # Add gradual progress based on time elapsed for better UX
    if base_progress < 30 and attempt > 60:  # After 1 minute
        progress = min(base_progress + (attempt - 60) * 0.5, 30)
    elif base_progress < 50 and attempt > 300:  # After 5 minutes
        progress = min(base_progress + (attempt - 300) * 0.3, 50)
    elif base_progress < 70 and attempt > 600:  # After 10 minutes
        progress = min(base_progress + (attempt - 600) * 0.2, 70)
    else:
        progress = base_progress

    progress = min(progress, 85)  # Cap at 85% until actually complete

    # Enhanced status messages based on elapsed time
    if attempt <= 60:  # First minute
        message = "AI analyzing video for text detection..."
    elif attempt <= 300:  # First 5 minutes
        message = "AI processing detected text areas..."
    elif attempt <= 600:  # First 10 minutes
        message = "Advanced inpainting in progress..."
    elif attempt <= 1200:  # First 20 minutes
        message = "Complex text removal processing..."
    elif attempt <= 1800:  # First 30 minutes
        message = "Finalizing video quality optimization..."
    else:  # After 30 minutes
        message = "Professional video processing continues..."

    return int(progress), message


def get_sleep_interval(attempt: int) -> int:
    """
    Get sleep interval based on attempt number
    """
    # 5 seconds after 1 minute, 3 seconds before
    return 5 if attempt > 60 else 3
