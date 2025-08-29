"""
Direct video processing without Celery - Immediate GhostCut API integration
Processes videos instantly when uploaded, no queue delays
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
import shutil
import logging
import asyncio
import aiohttp
import json
import hashlib

from backend.models.database import get_database
from backend.models.user import User
from backend.models.file import File, FileType
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from backend.services.s3_service import s3_service
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

async def call_ghostcut_api_async(video_url: str, job_id: str) -> str:
    """
    Directly call GhostCut API asynchronously - NO CELERY!
    Returns the GhostCut task ID immediately
    """
    
    url = f"{settings.ghostcut_api_url}/v-w-c/gateway/ve/work/free"
    
    # Prepare request data
    request_data = {
        "urls": [video_url],
        "uid": settings.ghostcut_uid,
        "workName": f"Processed_video_{job_id[:8]}",
        "resolution": "1080p",
        "needChineseOcclude": 1,  # Full-screen text removal
        "videoInpaintLang": "all"
    }
    
    body = json.dumps(request_data)
    
    # Calculate signature
    md5_1 = hashlib.md5()
    md5_1.update(body.encode('utf-8'))
    body_md5hex = md5_1.hexdigest()
    md5_2 = hashlib.md5()
    body_md5hex = (body_md5hex + settings.ghostcut_app_secret).encode('utf-8')
    md5_2.update(body_md5hex)
    sign = md5_2.hexdigest()
    
    headers = {
        'Content-type': 'application/json',
        'AppKey': settings.ghostcut_api_key,
        'AppSign': sign,
    }
    
    logger.info(f"Calling GhostCut API directly for job {job_id}")
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=request_data, headers=headers, timeout=30) as response:
            result = await response.json()
            
            if result.get("code") == 1000:
                body_data = result.get("body", {})
                ghostcut_job_id = body_data.get("idProject")
                
                if not ghostcut_job_id:
                    data_list = body_data.get("dataList", [])
                    if data_list:
                        ghostcut_job_id = data_list[0].get("id")
                
                logger.info(f"GhostCut job created immediately: {ghostcut_job_id}")
                return str(ghostcut_job_id)
            else:
                raise Exception(f"GhostCut API error: {result.get('msg', 'Unknown error')}")

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
        job.started_at = datetime.utcnow()
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
        
        # Call GhostCut API immediately
        ghostcut_task_id = await call_ghostcut_api_async(video_url, job_id)
        
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
        job.completed_at = datetime.utcnow()
        db.commit()
        raise

async def monitor_ghostcut_status(job_id: str, ghostcut_task_id: str):
    """
    Background task to monitor GhostCut processing status
    """
    db = SessionLocal()
    try:
        while True:
            await asyncio.sleep(10)  # Check every 10 seconds
            
            # Check status from GhostCut
            status = await check_ghostcut_status_async(ghostcut_task_id)
            
            job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
            if not job:
                break
            
            if status["status"] == "completed":
                # Download result and update job
                job.status = JobStatus.COMPLETED.value
                job.completed_at = datetime.utcnow()
                job.progress_percentage = 100
                job.progress_message = "Processing completed successfully"
                
                # Save the output URL for download
                if "output_url" in status:
                    job.output_url = status["output_url"]
                    logger.info(f"Job {job_id} completed with output URL: {status['output_url']}")
                
                db.commit()
                logger.info(f"Job {job_id} completed successfully")
                break
                
            elif status["status"] == "failed":
                job.status = JobStatus.FAILED.value
                job.error_message = status.get("error", "Processing failed")
                job.completed_at = datetime.utcnow()
                db.commit()
                logger.error(f"Job {job_id} failed: {status.get('error')}")
                break
            else:
                # Still processing
                job.progress_percentage = min(status.get("progress", 50), 90)
                job.progress_message = f"AI processing... {status.get('progress', 0)}%"
                db.commit()
                
    except Exception as e:
        logger.error(f"Error monitoring job {job_id}: {e}")
    finally:
        db.close()

async def check_ghostcut_status_async(ghostcut_task_id: str) -> dict:
    """
    Check GhostCut job status asynchronously
    """
    url = f"{settings.ghostcut_api_url}/v-w-c/gateway/ve/work/status"
    
    request_data = {"idProjects": [int(ghostcut_task_id)]}
    body = json.dumps(request_data)
    
    md5_1 = hashlib.md5()
    md5_1.update(body.encode('utf-8'))
    body_md5hex = md5_1.hexdigest()
    md5_2 = hashlib.md5()
    body_md5hex = (body_md5hex + settings.ghostcut_app_secret).encode('utf-8')
    md5_2.update(body_md5hex)
    sign = md5_2.hexdigest()
    
    headers = {
        'Content-type': 'application/json',
        'AppKey': settings.ghostcut_api_key,
        'AppSign': sign,
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=request_data, headers=headers, timeout=30) as response:
            result = await response.json()
            
            if result.get("code") == 1000:
                content = result.get("body", {}).get("content", [])
                if content:
                    task_data = content[0]
                    process_progress = task_data.get("processProgress", 0.0)
                    video_url = task_data.get("videoUrl", "")
                    
                    if process_progress >= 100.0:
                        return {"status": "completed", "output_url": video_url, "progress": 100}
                    elif process_progress > 0:
                        return {"status": "processing", "progress": int(process_progress)}
                    else:
                        return {"status": "pending", "progress": 0}
            
            return {"status": "error", "error": result.get("msg", "Unknown error")}

@router.post("/direct-process", response_model=DirectProcessResponse)
async def direct_process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    display_name: Optional[str] = Form(None),
    db: Session = Depends(get_database)
):
    """
    Process video IMMEDIATELY without Celery queue
    Video is sent to GhostCut API instantly
    """
    
    # Get or create test user (TODO: Re-enable authentication)
    current_user = db.query(User).first()
    if not current_user:
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
        },
        estimated_credits=10,
        queued_at=datetime.utcnow(),
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

@router.post("/batch-process", response_model=BatchProcessResponse)
async def batch_process_videos(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = FastAPIFile(...),
    db: Session = Depends(get_database)
):
    """
    Process MULTIPLE videos simultaneously
    All videos are sent to GhostCut API immediately
    """
    
    # Get or create test user
    current_user = db.query(User).first()
    if not current_user:
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
    
    jobs = []
    
    for file in files:
        # Process each file
        try:
            # Save file
            file_id = uuid.uuid4()
            job_id = uuid.uuid4()
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{file_id}{file_extension}"
            
            upload_dir = os.path.join(settings.upload_path, str(current_user.id))
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, unique_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Create records
            db_file = File(
                id=file_id,
                user_id=current_user.id,
                filename=unique_filename,
                original_filename=file.filename,
                file_type=FileType.INPUT_VIDEO,
                mime_type=file.content_type or "video/mp4",
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
                display_name=f"Text Removal - {file.filename}",
                status=JobStatus.QUEUED.value,
                processing_config={
                    "type": "direct_ghostcut",
                    "local_video_path": file_path,
                    "video_file_id": str(file_id),
                },
                estimated_credits=10,
                queued_at=datetime.utcnow(),
            )
            db.add(job)
            db.commit()
            
            # Process immediately
            ghostcut_task_id = await process_video_immediately(
                str(job_id),
                file_path,
                db,
                background_tasks
            )
            
            jobs.append(DirectProcessResponse(
                job_id=str(job_id),
                filename=file.filename,
                message="Processing started",
                status="processing",
                ghostcut_task_id=ghostcut_task_id
            ))
            
        except Exception as e:
            logger.error(f"Failed to process {file.filename}: {e}")
            jobs.append(DirectProcessResponse(
                job_id="",
                filename=file.filename,
                message=f"Failed: {str(e)}",
                status="failed",
                ghostcut_task_id=None
            ))
    
    return BatchProcessResponse(
        jobs=jobs,
        total_files=len(files),
        message=f"Processing {len([j for j in jobs if j.status == 'processing'])} videos"
    )

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str, db: Session = Depends(get_database)):
    """
    Get real-time status of a processing job
    """
    
    job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # If job has GhostCut task ID, check real status
    if job.zhaoli_task_id and job.status == JobStatus.PROCESSING.value:
        status = await check_ghostcut_status_async(job.zhaoli_task_id)
        
        # Update job with latest status
        if status["status"] == "completed":
            job.status = JobStatus.COMPLETED.value
            job.progress_percentage = 100
            job.progress_message = "Processing completed"
        elif status["status"] == "processing":
            job.progress_percentage = status.get("progress", 50)
            job.progress_message = f"Processing... {status.get('progress', 0)}%"
        
        db.commit()
    
    return {
        "job_id": str(job.id),
        "status": job.status,
        "progress": job.progress_percentage,
        "message": job.progress_message,
        "ghostcut_task_id": job.zhaoli_task_id,
        "created_at": job.created_at,
        "completed_at": job.completed_at
    }