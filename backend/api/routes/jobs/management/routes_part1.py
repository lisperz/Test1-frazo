"""
Jobs management routes - Part 1
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import datetime
import uuid
import os
import shutil
import logging
import asyncio
import aiohttp
import json
import hashlib

from backend.models.database import get_database, SessionLocal
from backend.models.user import User
from backend.models.file import File, FileType
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from backend.services.s3 import s3_service
from backend.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class DirectProcessResponse(BaseModel):
    job_id: str
    filename: str
    message: str
    status: str
    ghostcut_task_id: Optional[str] = None


class BatchProcessResponse(BaseModel):
    jobs: List[DirectProcessResponse]
    total_files: int
    message: str


async def process_video_immediately(
    job_id: str,
    file_path: str,
    db: Session,
    background_tasks: BackgroundTasks
) -> Optional[str]:
    """Process video immediately without Celery queue"""
    # Placeholder implementation
    logger.info(f"Processing video immediately: {job_id}")
    return "ghostcut_task_id_placeholder"


async def check_ghostcut_status_async(task_id: str) -> dict:
    """Check GhostCut task status asynchronously"""
    # Placeholder implementation
    return {"status": "processing", "progress": 50}


@router.post("/direct-process", response_model=DirectProcessResponse)
async def direct_process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    display_name: Optional[str] = Form(None),
    effects: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Process video IMMEDIATELY without Celery queue"""

    logger.info("🟢 FUNCTION START - direct_process_video called")
    logger.info("🚀 DIRECT PROCESS ENDPOINT CALLED!")
    logger.info(f"📄 File: {file.filename if file else 'No file'}")
    logger.info(f"📊 Effects: {effects}")

    # Use authenticated user from JWT token
    logger.info(f"🔐 Processing video for user: {current_user.email} (ID: {current_user.id})")

    # Parse effects data if provided
    effects_data = []
    if effects:
        logger.info(f"🔍 RAW EFFECTS STRING RECEIVED: {effects}")
        try:
            effects_data = json.loads(effects)
            logger.info(f"Parsed {len(effects_data)} effects for processing")
            logger.info(f"Effects data received: {effects_data}")
        except json.JSONDecodeError:
            logger.error(f"Invalid effects JSON: {effects}")
    else:
        logger.info("No effects data provided - will use full-screen processing")

    # Validate file
    if file.size and file.size > 2 * 1024 * 1024 * 1024:  # 2GB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 2GB"
        )

    # Save file locally first
    file_id = uuid.uuid4()
    job_id = uuid.uuid4()
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_id}{file_extension}"

    upload_dir = os.path.join(settings.upload_path, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Create database records
    db_file = File(
        id=file_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=FileType.INPUT_VIDEO,
        mime_type=file.content_type,
        file_size_bytes=os.path.getsize(file_path),
        storage_path=file_path,
        storage_provider='local',
        is_public=False
    )
    db.add(db_file)

    job = VideoJob(
        id=job_id,
        user_id=current_user.id,
        original_filename=file.filename,
        display_name=display_name or f"Text Removal - {file.filename}",
        status=JobStatus.QUEUED.value,
        processing_config={
            "type": "direct_ghostcut",
            "local_video_path": file_path,
            "video_file_id": str(file_id),
            "effects_data": effects_data,  # Store the parsed effects data
        },
        estimated_credits=10,
        queued_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(job)
    db.commit()

    # Process immediately (no Celery!)
    logger.info(f"Processing video {job_id} IMMEDIATELY without queue")

    try:
        # This runs asynchronously but doesn't block the response
        ghostcut_task_id = await process_video_immediately(
            str(job_id),
            file_path,
            db,
            background_tasks
        )

        return DirectProcessResponse(
            job_id=str(job_id),
            filename=file.filename,
            message="Video sent to GhostCut API immediately! Processing started.",
            status="processing",
            ghostcut_task_id=ghostcut_task_id
        )

    except Exception as e:
        logger.error(f"Failed to start processing: {e}")
        return DirectProcessResponse(
            job_id=str(job_id),
            filename=file.filename,
            message=f"Failed to start processing: {str(e)}",
            status="failed",
            ghostcut_task_id=None
        )
