"""
Combined upload and process endpoint for simplified workflow
Based on zhaoli_processor.py logic: Upload → S3 → Zhaoli API → Process
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import os
import shutil
import logging

from backend.models.database import get_database
from backend.models.user import User
from backend.models.file import File, FileType
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from backend.workers.celery_app import app as celery_app  # Import configured Celery app
from backend.workers.ghostcut_tasks import process_ghostcut_video
from backend.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
class UploadAndProcessResponse(BaseModel):
    id: str  # Job ID for tracking
    file_id: str
    filename: str
    message: str
    status: str

@router.post("/upload-and-process", response_model=UploadAndProcessResponse)
async def upload_and_process_video(
    file: UploadFile = FastAPIFile(...),
    display_name: Optional[str] = Form(None),
    # current_user: User = Depends(get_current_user),  # Temporarily disabled for testing
    db: Session = Depends(get_database)
):
    """
    Upload a video file and immediately start text inpainting processing.
    Combines file upload + automatic GhostCut processing in one endpoint.
    """
    
    # TODO: Re-enable authentication after testing
    # For now, create a test user
    current_user = db.query(User).first()
    if not current_user:
        # Create test user if none exists
        current_user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            hashed_password="dummy",
            is_active=True,
            credits_balance=1000
        )
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
    
    logger.info(f"Processing video upload for user: {current_user.email}")
    
    # Validate file size (max 2GB)
    max_size = 2 * 1024 * 1024 * 1024  # 2GB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum of 2GB"
        )
    
    # Validate file type for videos
    allowed_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate unique identifiers
    file_id = uuid.uuid4()
    job_id = uuid.uuid4()
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_id}{file_extension}"
    
    # Ensure upload directory exists
    upload_dir = os.path.join(settings.upload_path, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file to disk
    file_path = os.path.join(upload_dir, unique_filename)
    try:
        logger.info(f"Saving uploaded file to: {file_path}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Get file size
    file_size = os.path.getsize(file_path)
    logger.info(f"File saved successfully. Size: {file_size} bytes")
    
    # Create file database record
    db_file = File(
        id=file_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename or "uploaded_video",
        file_type=FileType.INPUT_VIDEO,
        mime_type=file.content_type,
        file_size_bytes=file_size,
        storage_path=file_path,
        storage_provider='local',
        is_public=False
    )
    
    db.add(db_file)
    
    # Calculate estimated credits (rough estimate: 10 credits per video)
    estimated_credits = 10
    
    # Check user credits
    if current_user.credits_balance < estimated_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {estimated_credits}, Available: {current_user.credits_balance}"
        )
    
    # Create processing job record
    job = VideoJob(
        id=job_id,
        user_id=current_user.id,
        original_filename=file.filename or "uploaded_video",
        display_name=display_name or f"Text Removal - {file.filename or 'Video'}",
        status=JobStatus.QUEUED.value,
        processing_config={
            "type": "ghostcut_auto",
            "local_video_path": file_path,
            "video_file_id": str(file_id),
            "language": "auto",
            "erasures": [],  # Empty - using auto detection
            "protected_areas": [],
            "text_areas": [],
            "auto_detect_text": True,  # Enable automatic text detection
        },
        estimated_credits=estimated_credits,
        queued_at=datetime.utcnow(),
    )
    
    db.add(job)
    db.commit()
    
    # Queue the processing task immediately with high priority
    logger.info(f"Queuing GhostCut processing task for job: {job_id}")
    task = process_ghostcut_video.apply_async(
        args=[str(job_id)],
        queue='video_processing',
        routing_key='video_processing',
        priority=10,  # High priority for immediate processing
        countdown=0   # No delay
    )
    
    # Update job with task ID
    job.celery_task_id = task.id
    db.commit()
    
    logger.info(f"Task dispatched with ID: {task.id}")
    
    logger.info(f"Successfully created upload and processing job {job_id} for user {current_user.id}")
    
    return UploadAndProcessResponse(
        id=str(job_id),
        file_id=str(file_id),
        filename=file.filename or "uploaded_video",
        message="Video uploaded and processing started successfully",
        status="queued"
    )