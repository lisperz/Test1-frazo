"""
Jobs management routes - Part 3
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging

from backend.models.database import get_database
from backend.models.user import User
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# Import ProcessingTemplate if available
try:
    from backend.models.job import ProcessingTemplate
except ImportError:
    ProcessingTemplate = None


@router.post("/{job_id}/retry")
async def retry_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Retry a failed job
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    job = db.query(VideoJob).filter(
        VideoJob.id == job_uuid,
        VideoJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if job can be retried
    if not job.can_retry():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job cannot be retried (not failed or max retries reached)"
        )

    # Check if user has sufficient credits
    if not current_user.has_sufficient_credits(job.estimated_credits or 10):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits for retry. Required: {job.estimated_credits}, Available: {current_user.credits_balance}"
        )

    # Reset job for retry
    job.increment_retry()
    job.update_status(JobStatus.QUEUED, f"Job queued for retry (attempt {job.retry_count + 1})")
    job.error_message = None
    job.error_code = None
    job.progress_percentage = 0

    db.commit()

    # TODO: Queue job for background processing
    # queue_video_processing_job(job.id)

    return {"message": "Job queued for retry"}

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Delete a job and its associated files
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    job = db.query(VideoJob).filter(
        VideoJob.id == job_uuid,
        VideoJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Cancel job if it's still processing
    if job.is_processing:
        job.update_status(JobStatus.CANCELED, "Job cancelled for deletion")
        # TODO: Cancel background processing task
        # cancel_processing_task(job.id)

    # Delete associated files
    for file in job.files:
        # TODO: Delete file from storage
        # delete_file_from_storage(file.storage_path)
        db.delete(file)

    # Delete job
    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}

@router.get("/templates/", response_model=List[dict])
async def get_processing_templates():
    """
    Get available processing templates
    """
    templates = ProcessingTemplate.get_default_configs()
    return [
        {
            "id": key,
            "name": config["name"],
            "description": config["description"],
            "config": config["config"]
        }
        for key, config in templates.items()
    ]