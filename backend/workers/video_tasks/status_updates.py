"""
Status update and notification functions for video tasks
"""

import logging
from typing import Optional
from celery import current_task

from backend.models.user import User
from backend.models.job import VideoJob

logger = logging.getLogger(__name__)


def send_websocket_update(
    user_id: str,
    job_id: str,
    progress: int,
    message: str,
    status: str
) -> None:
    """
    Send real-time WebSocket update
    """
    try:
        from backend.api.websocket import send_job_update
        send_job_update(user_id, job_id, {
            "progress": progress,
            "message": message,
            "status": status
        })
    except Exception as e:
        logger.error(f"Error sending WebSocket update: {e}")


def create_progress_callback(db, job: VideoJob, user: User, task_self):
    """
    Create a progress callback function for updating job status
    """
    def progress_callback(progress: float, message: str):
        try:
            job.progress_percentage = min(100, max(0, int(progress)))
            job.progress_message = message
            db.commit()

            # Send real-time update via WebSocket
            send_websocket_update(
                str(user.id),
                str(job.id),
                job.progress_percentage,
                message,
                job.status
            )

            # Update Celery task progress
            task_self.update_state(
                state='PROGRESS',
                meta={'current': progress, 'total': 100, 'message': message}
            )

        except Exception as e:
            logger.error(f"Error updating progress: {e}")

    return progress_callback


def send_completion_notification_sync(user_id: str, job_id: str) -> None:
    """
    Send notification when job is completed (synchronous version)
    """
    try:
        from backend.api.websocket import send_job_update

        send_job_update(user_id, job_id, {
            "type": "job_completed",
            "message": "Your video processing is complete!",
            "download_url": f"/api/v1/files/{job_id}/download"
        })

        # TODO: Send email notification if enabled

    except Exception as e:
        logger.error(f"Error sending completion notification: {e}")


def send_failure_notification_sync(
    user_id: str,
    job_id: str,
    error_message: str
) -> None:
    """
    Send notification when job fails (synchronous version)
    """
    try:
        from backend.api.websocket import send_job_update

        send_job_update(user_id, job_id, {
            "type": "job_failed",
            "message": f"Video processing failed: {error_message}",
            "error": error_message
        })

    except Exception as e:
        logger.error(f"Error sending failure notification: {e}")
