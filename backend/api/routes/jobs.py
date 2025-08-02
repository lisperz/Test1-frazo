"""
Video processing job routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import os
import magic

from backend.models.database import get_database
from backend.models.user import User
from backend.models.job import VideoJob, JobStatus, ProcessingTemplate
from backend.models.file import File as FileModel, FileType
from backend.auth.dependencies import get_current_user, validate_user_limits
from backend.config import settings

router = APIRouter()

# Pydantic models
class JobCreate(BaseModel):
    display_name: Optional[str] = None
    processing_config: Optional[dict] = None

class JobResponse(BaseModel):
    id: str
    user_id: str
    original_filename: str
    display_name: Optional[str]
    status: str
    progress_percentage: int
    progress_message: Optional[str]
    processing_config: dict
    estimated_credits: Optional[int]
    actual_credits_used: Optional[int]
    video_duration_seconds: Optional[int]
    video_resolution: Optional[str]
    queued_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class JobStatusResponse(BaseModel):
    id: str
    status: str
    progress_percentage: int
    progress_message: Optional[str]
    error_message: Optional[str]
    download_url: Optional[str]
    
    class Config:
        from_attributes = True

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int

@router.post("/submit", response_model=JobResponse)
async def submit_video_job(
    video_file: UploadFile = File(...),
    display_name: Optional[str] = Form(None),
    processing_config: Optional[str] = Form("{}"),  # JSON string
    current_user: User = Depends(validate_user_limits),
    db: Session = Depends(get_database)
):
    """
    Submit a new video processing job
    """
    import json
    
    # Parse processing config
    try:
        config = json.loads(processing_config or "{}")
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid processing configuration JSON"
        )
    
    # Validate file
    if not video_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    # Check file extension
    file_ext = os.path.splitext(video_file.filename)[1].lower()
    if file_ext not in settings.allowed_video_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed: {settings.allowed_video_extensions}"
        )
    
    # Check file size
    if video_file.size and video_file.size > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB"
        )
    
    # Validate file content (MIME type)
    file_content = await video_file.read(1024)  # Read first 1KB for type detection
    await video_file.seek(0)  # Reset file pointer
    
    try:
        mime_type = magic.from_buffer(file_content, mime=True)
        if not mime_type.startswith('video/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not a valid video format"
            )
    except Exception:
        # Fallback if python-magic is not available
        pass
    
    # Create job record
    job = VideoJob(
        user_id=current_user.id,
        original_filename=video_file.filename,
        display_name=display_name or video_file.filename,
        processing_config=config,
        input_file_size_mb=round(video_file.size / (1024 * 1024), 2) if video_file.size else None
    )
    
    # Set default processing config if not provided
    if not config:
        job.processing_config = ProcessingTemplate.get_default_configs()["basic"]["config"]
    
    db.add(job)
    db.flush()  # Get the job ID
    
    # Create file record for input video
    input_file = FileModel.create_for_upload(
        user_id=current_user.id,
        original_filename=video_file.filename,
        file_type=FileType.INPUT_VIDEO,
        job_id=job.id
    )
    input_file.file_size_bytes = video_file.size
    input_file.mime_type = mime_type if 'mime_type' in locals() else f"video/{file_ext[1:]}"
    
    db.add(input_file)
    db.commit()
    db.refresh(job)
    
    # TODO: Save uploaded file to storage
    # - Save to temporary location
    # - Upload to S3
    # - Queue job for processing
    
    # For now, we'll simulate the process
    try:
        # Save file temporarily
        temp_path = os.path.join(settings.upload_temp_dir, str(current_user.id))
        os.makedirs(temp_path, exist_ok=True)
        
        file_path = os.path.join(temp_path, input_file.filename)
        with open(file_path, "wb") as buffer:
            content = await video_file.read()
            buffer.write(content)
        
        # Update file path
        input_file.storage_path = file_path
        
        # Estimate credits required (basic estimation)
        job.estimated_credits = job.estimate_credits_required()
        
        # Check if user has sufficient credits
        if not current_user.has_sufficient_credits(job.estimated_credits or 10):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Required: {job.estimated_credits}, Available: {current_user.credits_balance}"
            )
        
        # Update job status
        job.update_status(JobStatus.QUEUED, "Job queued for processing")
        
        db.commit()
        
        # TODO: Queue job for background processing
        # queue_video_processing_job(job.id)
        
    except Exception as e:
        # Clean up on error
        db.rollback()
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process upload: {str(e)}"
        )
    
    return JobResponse(
        id=str(job.id),
        user_id=str(job.user_id),
        original_filename=job.original_filename,
        display_name=job.display_name,
        status=job.status,
        progress_percentage=job.progress_percentage,
        progress_message=job.progress_message,
        processing_config=job.processing_config,
        estimated_credits=job.estimated_credits,
        actual_credits_used=job.actual_credits_used,
        video_duration_seconds=job.video_duration_seconds,
        video_resolution=job.video_resolution,
        queued_at=job.queued_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
        created_at=job.created_at
    )

@router.get("/", response_model=JobListResponse)
async def get_user_jobs(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Get user's video processing jobs
    """
    # Build query
    query = db.query(VideoJob).filter(VideoJob.user_id == current_user.id)
    
    # Apply status filter
    if status_filter:
        query = query.filter(VideoJob.status == status_filter)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    jobs = query.order_by(VideoJob.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Convert to response format
    job_responses = [
        JobResponse(
            id=str(job.id),
            user_id=str(job.user_id),
            original_filename=job.original_filename,
            display_name=job.display_name,
            status=job.status,
            progress_percentage=job.progress_percentage,
            progress_message=job.progress_message,
            processing_config=job.processing_config,
            estimated_credits=job.estimated_credits,
            actual_credits_used=job.actual_credits_used,
            video_duration_seconds=job.video_duration_seconds,
            video_resolution=job.video_resolution,
            queued_at=job.queued_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message,
            created_at=job.created_at
        )
        for job in jobs
    ]
    
    return JobListResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_details(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Get details of a specific job
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
    
    return JobResponse(
        id=str(job.id),
        user_id=str(job.user_id),
        original_filename=job.original_filename,
        display_name=job.display_name,
        status=job.status,
        progress_percentage=job.progress_percentage,
        progress_message=job.progress_message,
        processing_config=job.processing_config,
        estimated_credits=job.estimated_credits,
        actual_credits_used=job.actual_credits_used,
        video_duration_seconds=job.video_duration_seconds,
        video_resolution=job.video_resolution,
        queued_at=job.queued_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        error_message=job.error_message,
        created_at=job.created_at
    )

@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Get current status of a job
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
    
    # Get download URL if job is completed
    download_url = None
    if job.is_completed:
        output_file = job.get_output_file()
        if output_file:
            download_url = f"/api/v1/files/{output_file.id}/download"
    
    return JobStatusResponse(
        id=str(job.id),
        status=job.status,
        progress_percentage=job.progress_percentage,
        progress_message=job.progress_message,
        error_message=job.error_message,
        download_url=download_url
    )

@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Cancel a processing job
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
    
    # Check if job can be cancelled
    if job.status in [JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status: {job.status}"
        )
    
    # Cancel job
    job.update_status(JobStatus.CANCELED, "Job cancelled by user")
    db.commit()
    
    # TODO: Cancel background processing task
    # cancel_processing_task(job.id)
    
    return {"message": "Job cancelled successfully"}

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