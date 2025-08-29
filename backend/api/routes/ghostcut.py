"""
GhostCut API routes for video text inpainting
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

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class GhostCutBox(BaseModel):
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    rect: List[float] = Field(..., min_items=4, max_items=4, description="[x, y, width, height] normalized 0-1")

class GhostCutRenderRequest(BaseModel):
    video_id: str = Field(..., description="File ID of the uploaded video")
    language: str = Field("auto", description="Language for text detection")
    erasures: List[GhostCutBox] = Field(default_factory=list, description="Areas to erase")
    protected_areas: Optional[List[GhostCutBox]] = Field(default_factory=list, description="Areas to protect")
    text_areas: Optional[List[GhostCutBox]] = Field(default_factory=list, description="Text areas to process")
    auto_detect_text: Optional[bool] = Field(True, description="Enable automatic text detection and removal")

class GhostCutJobResponse(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Job status")
    progress: Optional[int] = Field(None, description="Progress percentage")
    message: Optional[str] = Field(None, description="Status message")
    output_url: Optional[str] = Field(None, description="URL of processed video")
    error: Optional[str] = Field(None, description="Error message if failed")
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

@router.post("/render", response_model=GhostCutJobResponse)
async def submit_ghostcut_job(
    request: GhostCutRenderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Submit a new GhostCut video processing job
    """
    
    # Get the video file
    try:
        video_file_uuid = uuid.UUID(request.video_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid video file ID format"
        )
    
    video_file = db.query(File).filter(
        File.id == video_file_uuid,
        File.user_id == current_user.id
    ).first()
    
    if not video_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video file not found"
        )
    
    # Validate that file exists on disk
    if not os.path.exists(video_file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video file no longer exists on server"
        )
    
    # Validate box coordinates
    for box_list in [request.erasures, request.protected_areas or [], request.text_areas or []]:
        for box in box_list:
            if not all(0 <= coord <= 1 for coord in box.rect):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rectangle coordinates must be normalized between 0 and 1"
                )
            if box.start < 0 or box.end < box.start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid time range: start must be >= 0 and end must be >= start"
                )
    
    # Check user credits
    estimated_credits = calculate_credits_estimate(request)
    if current_user.credits_balance < estimated_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {estimated_credits}, Available: {current_user.credits_balance}"
        )
    
    # Create job record
    job_id = str(uuid.uuid4())
    job = VideoJob(
        id=uuid.UUID(job_id),
        user_id=current_user.id,
        original_filename=video_file.original_filename,
        display_name=f"Text Removal - {video_file.original_filename}",
        status=JobStatus.QUEUED,
        processing_config={
            "type": "ghostcut",
            "local_video_path": video_file.storage_path,
            "video_file_id": request.video_id,
            "language": request.language,
            "erasures": [box.dict() for box in request.erasures],
            "protected_areas": [box.dict() for box in (request.protected_areas or [])],
            "text_areas": [box.dict() for box in (request.text_areas or [])],
            "auto_detect_text": request.auto_detect_text or False,
        },
        estimated_credits=estimated_credits,
        queued_at=datetime.utcnow(),
    )
    
    db.add(job)
    db.commit()
    
    # Queue the processing task
    task = process_ghostcut_video.delay(job_id)
    
    # Update job with task ID
    job.celery_task_id = task.id
    db.commit()
    
    logger.info(f"Created GhostCut job {job_id} for user {current_user.id}")
    
    return GhostCutJobResponse(
        job_id=job_id,
        status="queued",
        message="Job queued for processing",
        created_at=job.created_at
    )

@router.get("/jobs/{job_id}", response_model=GhostCutJobResponse)
async def get_ghostcut_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Get the status of a GhostCut processing job
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
    
    # Check if it's a GhostCut job
    if job.processing_config.get("type") != "ghostcut":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a GhostCut job"
        )
    
    # Get output URL if completed
    output_url = None
    if job.status == JobStatus.COMPLETED:
        output_file = job.get_output_file()
        if output_file:
            output_url = f"{settings.api_base_url}/files/{output_file.id}/download"
    
    return GhostCutJobResponse(
        job_id=str(job.id),
        status=job.status.value,
        progress=job.progress_percentage,
        message=job.progress_message,
        output_url=output_url,
        error=job.error_message,
        created_at=job.created_at
    )

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
        from backend.workers.celery_app import app
        app.control.revoke(job.celery_task_id, terminate=True)
    
    logger.info(f"Cancelled GhostCut job {job_id} for user {current_user.id}")
    
    return {"message": "Job cancelled successfully"}

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

def calculate_credits_estimate(request: GhostCutRenderRequest) -> int:
    """
    Calculate estimated credits for a GhostCut job
    """
    # Base cost
    base_cost = 10
    
    # Add cost per annotation
    total_annotations = len(request.erasures)
    if request.protected_areas:
        total_annotations += len(request.protected_areas)
    if request.text_areas:
        total_annotations += len(request.text_areas)
    
    annotation_cost = total_annotations * 2
    
    return base_cost + annotation_cost