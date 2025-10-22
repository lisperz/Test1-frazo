"""
Ghostcut routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
import os
import logging

from backend.models.database import get_database
from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File
from backend.auth.dependencies import get_current_user
from backend.workers.ghostcut_tasks import process_ghostcut_video
from backend.config import settings
@router.post("/jobs/{job_id}/cancel")
async def cancel_ghostcut_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Cancel a GhostCut processing job
    """

    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    # Get job from database
    job = db.query(VideoJob).filter(
        VideoJob.id == job_uuid,
        VideoJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Check if job can be cancelled
    if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job in {job.status.value} status"
        )

    # Update job status
    job.status = JobStatus.FAILED
    job.error_message = "Job cancelled by user"
    db.commit()

    # TODO: Cancel Celery task if running
    if job.celery_task_id:
@router.get("/jobs", response_model=dict)
async def list_ghostcut_jobs(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    List all GhostCut jobs for the current user
    """

    # Validate pagination
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 10

    # Query jobs
    query = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.processing_config["type"].astext == "ghostcut"
    )

    # Get total count
    total = query.count()

    # Get paginated results
    jobs = query.order_by(VideoJob.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    # Format response
    job_list = []
    for job in jobs:
        output_url = None
        if job.status == JobStatus.COMPLETED:
            output_file = job.get_output_file()
            if output_file:
                output_url = f"{settings.api_base_url}/files/{output_file.id}/download"

        job_list.append({
            "job_id": str(job.id),
            "status": job.status.value,
            "progress": job.progress_percentage,
            "message": job.progress_message,
            "output_url": output_url,
            "error": job.error_message,
            "created_at": job.created_at.isoformat()
        })

    return {
        "jobs": job_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }
