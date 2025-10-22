"""
Celery tasks for GhostCut video processing
"""

from celery import current_task
from sqlalchemy.orm import Session
import logging
import os
import uuid
import requests
import time
from datetime import datetime
from typing import Dict, Any, List

from backend.workers.celery_app import app
from backend.models.database import SessionLocal
from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File, FileType
from backend.config import settings
from backend.services.ghostcut_client import GhostCutClient
from backend.services.s3_service import s3_service

logger = logging.getLogger(__name__)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session will be closed in finally block of calling function

@app.task(bind=True, max_retries=3, queue='video_processing', routing_key='video_processing')
def process_ghostcut_video(self, job_id: str):
    """
    Process video using GhostCut API for text inpainting
    """
    db = get_db()
    try:
        # Get job from database
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found")
            return {"success": False, "error": "Job not found"}
        
        # Get user
        user = db.query(User).filter(User.id == job.user_id).first()
        if not user:
            logger.error(f"User {job.user_id} not found for job {job_id}")
            return {"success": False, "error": "User not found"}
        
        # Update job status to processing
        job.status = JobStatus.PROCESSING.value
        job.started_at = datetime.utcnow()
        job.progress_percentage = 0
        job.progress_message = "Initializing GhostCut processing"
        db.commit()
        
        # Send WebSocket update
        send_progress_update(user, job, 0, "Starting GhostCut processing")
        
        # Extract processing config
        config = job.processing_config
        local_video_path = config.get("local_video_path")
        language = config.get("language", "auto")
        erasures = config.get("erasures", [])
        protected_areas = config.get("protected_areas", [])
        text_areas = config.get("text_areas", [])
        auto_detect_text = config.get("auto_detect_text", False)
        
        if not local_video_path:
            raise ValueError("No local video path provided")
        
        if not os.path.exists(local_video_path):
            raise ValueError(f"Video file does not exist: {local_video_path}")
        
        # Step 1: Upload video to S3 and get public URL
        send_progress_update(user, job, 5, "Uploading video to S3...")
        
        # Generate S3 key with user and job info
        filename = os.path.basename(local_video_path)
        s3_key = f"users/{user.id}/jobs/{job.id}/{filename}"
        
        video_url = s3_service.upload_video_and_get_url(local_video_path, s3_key)
        
        if not video_url:
            raise ValueError("Failed to upload video to S3")
        
        # Initialize GhostCut client with Zhaoli API credentials
        ghostcut_client = GhostCutClient(
            api_key=settings.ghostcut_api_key,
            api_secret=settings.ghostcut_app_secret,
            api_url=settings.ghostcut_api_url or "https://api.zhaoli.com"
        )
        
        logger.info(f"Video uploaded to S3: {video_url}")
        
        # Store S3 URL in job metadata
        if not job.job_metadata:
            job.job_metadata = {}
        job.job_metadata["s3_video_url"] = video_url
        job.job_metadata["s3_key"] = s3_key
        db.commit()
        
        # Step 2: Submit to Zhaoli API
        send_progress_update(user, job, 15, "Submitting to Zhaoli API for text inpainting...")
        
        # Submit job to Zhaoli API (GhostCut backend)
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
        
        # Poll for status - no timeout, continue until completion
        attempt = 0
        
        while True:  # Poll indefinitely until completion or failure
            # Check job status
            status_response = ghostcut_client.get_job_status(ghostcut_job_id)
            
            if status_response["status"] == "completed":
                # Job completed successfully
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
                
            elif status_response["status"] == "failed":
                # Job failed
                error_message = status_response.get("error", "Unknown error")
                raise Exception(f"GhostCut processing failed: {error_message}")
                
            else:
                # Still processing
                attempt += 1
                
                # Enhanced progress calculation with better messaging
                base_progress = status_response.get("progress", 20)
                
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
                
                send_progress_update(user, job, int(progress), message)
                
                job.progress_percentage = int(progress)
                job.progress_message = message
                db.commit()
            
            # Wait before next poll - increase interval for long-running jobs
            sleep_interval = 5 if attempt > 60 else 3  # 5 seconds after 1 minute
            time.sleep(sleep_interval)
        
    except Exception as e:
        logger.error(f"Error processing GhostCut job {job_id}: {e}", exc_info=True)
        
        error_message = str(e)
        
        # Check if this is a timeout or temporary error that should keep processing
        if 'timeout' in error_message.lower() or 'timed out' in error_message.lower():
            # Don't fail the job for timeout - keep it in processing state
            logger.info(f"Job {job_id} encountered timeout, keeping in processing state")
            job.progress_message = "Processing continues..."
            db.commit()
            
            # Continue retrying silently
            if self.request.retries < self.max_retries:
                logger.info(f"Silently retrying GhostCut job {job_id}, attempt {self.request.retries + 1}")
                raise self.retry(countdown=60 * (self.request.retries + 1))
            
            # Even after max retries, keep job in processing state
            return {"success": False, "error": "Processing continues", "silent": True}
        
        # Only mark as failed for actual failures (not timeouts)
        if 'failed' in error_message.lower() or 'error' in error_message.lower():
            job.status = JobStatus.FAILED.value
            job.error_message = error_message
            job.completed_at = datetime.utcnow()
            db.commit()
            
            # Send failure notification
            send_progress_update(user, job, 0, f"Processing failed: {e}")
        else:
            # For any other errors, keep in processing state
            logger.warning(f"Job {job_id} error but keeping in processing: {e}")
            job.progress_message = "Processing continues..."
            db.commit()
        
        # Retry if retries available
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying GhostCut job {job_id}, attempt {self.request.retries + 1}")
            raise self.retry(countdown=60 * (self.request.retries + 1))  # Exponential backoff
        
        return {"success": False, "error": str(e)}
        
    finally:
        db.close()

@app.task
def check_ghostcut_completion():
    """
    Periodic task to check if any processing jobs have been completed in GhostCut
    This runs every 2 minutes to catch jobs that may have been completed
    """
    db = get_db()
    try:
        # Get all jobs that are still in processing state with zhaoli task IDs
        processing_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.zhaoli_task_id.isnot(None)
        ).all()
        
        logger.info(f"Checking completion status for {len(processing_jobs)} processing jobs")
        
        for job in processing_jobs:
            try:
                # Initialize GhostCut client
                ghostcut_client = GhostCutClient(
                    api_key=settings.ghostcut_api_key,
                    api_secret=settings.ghostcut_app_secret,
                    api_url=settings.ghostcut_api_url or "https://api.zhaoli.com"
                )
                
                # Check job status
                status_response = ghostcut_client.get_job_status(str(job.zhaoli_task_id))
                logger.info(f"Job {job.id} status check: {status_response}")
                
                if status_response["status"] == "completed":
                    # Job completed! Get output URL
                    output_url = status_response.get("output_url")
                    if output_url:
                        logger.info(f"Job {job.id} completed! Processing result...")
                        
                        # Get user for this job
                        user = db.query(User).filter(User.id == job.user_id).first()
                        if not user:
                            logger.error(f"User {job.user_id} not found for job {job.id}")
                            continue
                        
                        # Download the processed video
                        output_path = download_processed_video(output_url, str(job.id))
                        
                        # Create output file record
                        output_file = File(
                            id=uuid.uuid4(),
                            user_id=user.id,
                            filename=f"ghostcut_output_{job.id}.mp4",
                            file_type=FileType.OUTPUT_VIDEO,
                            file_size_bytes=os.path.getsize(output_path),
                            storage_path=output_path,
                            mime_type="video/mp4",
                            is_public=False
                        )
                        db.add(output_file)
                        
                        # Update job to completed
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
                            description=f"GhostCut processing job {job.id}",
                            job_id=job.id
                        )
                        db.add(transaction)
                        
                        db.commit()
                        
                        # Send completion notification
                        send_progress_update(user, job, 100, "Processing completed successfully")
                        
                        logger.info(f"Successfully completed job {job.id}")
                    
                elif status_response["status"] == "failed":
                    # Only mark as failed if it's a real failure, not timeout
                    error_message = status_response.get("error", "Processing failed")
                    if not any(word in error_message.lower() for word in ['timeout', 'timed out']):
                        job.status = JobStatus.FAILED.value
                        job.error_message = error_message
                        job.completed_at = datetime.utcnow()
                        db.commit()
                        logger.warning(f"Job {job.id} failed: {error_message}")
                    
                else:
                    # Still processing - update progress if available
                    progress = status_response.get("progress", job.progress_percentage or 20)
                    message = status_response.get("message", "Processing continues...")
                    
                    if progress > job.progress_percentage:
                        job.progress_percentage = progress
                        job.progress_message = message
                        db.commit()
                        
                        # Send progress update
                        user = db.query(User).filter(User.id == job.user_id).first()
                        if user:
                            send_progress_update(user, job, progress, message)
                    
            except Exception as e:
                logger.error(f"Error checking job {job.id} completion: {e}")
                continue
        
        logger.info(f"Completed checking {len(processing_jobs)} jobs")
        
    except Exception as e:
        logger.error(f"Error in check_ghostcut_completion: {e}")
    finally:
        db.close()

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