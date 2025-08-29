"""
Celery tasks for video processing
"""

from celery import current_task
from sqlalchemy.orm import Session
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from backend.workers.celery_app import app
from backend.models.database import SessionLocal
from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus, JobStatusHistory
from backend.models.file import File, FileType
from backend.config import settings

logger = logging.getLogger(__name__)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session will be closed in finally block of calling function

@app.task(bind=True, max_retries=3)
def process_video(self, job_id: str):
    """
    Main video processing task - integrates with existing video_processing.py
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
        job.update_status(JobStatus.PROCESSING, "Starting video processing")
        create_status_history(db, job, JobStatus.QUEUED.value, JobStatus.PROCESSING.value, "Processing started")
        db.commit()
        
        # Update progress callback
        def progress_callback(progress: float, message: str):
            try:
                job.progress_percentage = min(100, max(0, int(progress)))
                job.progress_message = message
                db.commit()
                
                # Send real-time update via WebSocket
                from backend.api.websocket import send_job_update
                send_job_update(str(user.id), str(job.id), {
                    "progress": job.progress_percentage,
                    "message": message,
                    "status": job.status
                })
                
                # Update Celery task progress
                self.update_state(
                    state='PROGRESS',
                    meta={'current': progress, 'total': 100, 'message': message}
                )
                
            except Exception as e:
                logger.error(f"Error updating progress: {e}")
        
        progress_callback(10, "Validating video file")
        
        # Get input file
        input_file = job.get_input_file()
        if not input_file:
            raise Exception("Input file not found")
        
        progress_callback(20, "Uploading to cloud storage")
        
        # Upload to S3 and get public URL (using existing code)
        from video_processing import upload_to_s3_and_get_url
        
        # Load AWS credentials (you might want to use your existing CSV reader)
        aws_access_key = settings.aws_access_key_id
        aws_secret_key = settings.aws_secret_access_key
        
        if not aws_access_key or not aws_secret_key:
            # Fallback to your existing CSV method
            import csv
            try:
                with open('harshilsuvarna_accessKeys.csv', 'r') as f:
                    reader = csv.reader(f)
                    next(reader)  # Skip header
                    aws_line = next(reader)
                    aws_access_key = aws_line[0]
                    aws_secret_key = aws_line[1]
            except Exception as e:
                logger.error(f"Could not load AWS credentials: {e}")
                raise Exception("AWS credentials not available")
        
        # Upload video to get public URL
        video_url = upload_to_s3_and_get_url(
            video_path=input_file.storage_path,
            access_key_id=aws_access_key,
            secret_access_key=aws_secret_key
        )
        
        if not video_url:
            raise Exception("Failed to upload video to S3")
        
        progress_callback(30, "Submitting to Ghostcut API")
        
        # Load Ghostcut credentials from config or JSON file
        ghostcut_config = {
            "app_key": settings.ghostcut_app_key,
            "app_secret": settings.ghostcut_app_secret,
            "ghostcut_uid": settings.ghostcut_uid
        }
        
        if not all(ghostcut_config.values()):
            # Fallback to your existing JSON config
            import json
            try:
                with open('zhaoli_config.json', 'r') as f:
                    config = json.load(f)
                    ghostcut_config.update(config)
            except Exception as e:
                logger.error(f"Could not load Ghostcut config: {e}")
        
        # Process video using existing function
        from video_processing import process_video as process_video_existing
        
        # Create output file record
        output_file = File.create_for_upload(
            user_id=job.user_id,
            original_filename=f"processed_{job.original_filename}",
            file_type=FileType.OUTPUT_VIDEO,
            job_id=job.id
        )
        db.add(output_file)
        db.commit()
        
        # Set output path
        output_path = os.path.join(
            settings.upload_temp_dir,
            str(job.user_id),
            "processed",
            output_file.filename
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        progress_callback(40, "Processing video with AI text removal")
        
        # Call existing video processing function
        result = process_video_existing(
            input_path=input_file.storage_path,
            output_path=output_path,
            access_key_id=aws_access_key,
            secret_access_key=aws_secret_key,
            region_name=settings.aws_region,
            selected_font="Arial.ttf",  # Default font
            use_zhaoli_api=True,
            app_key=ghostcut_config["app_key"],
            app_secret=ghostcut_config["app_secret"],
            ghostcut_uid=ghostcut_config["ghostcut_uid"]
        )
        
        if result and result.get('task_id'):
            job.zhaoli_task_id = result['task_id']
            db.commit()
            
            progress_callback(50, "Processing on Ghostcut servers")
            
            # Poll for completion
            success = poll_ghostcut_completion.delay(job_id, result['task_id']).get(timeout=1800)  # 30 minute timeout
            
            if success:
                progress_callback(90, "Finalizing processed video")
                
                # Update file information
                if os.path.exists(output_path):
                    output_file.storage_path = output_path
                    output_file.file_size_bytes = os.path.getsize(output_path)
                    
                    # Calculate actual credits used
                    if job.video_duration_seconds:
                        credits_used = max(1, int(job.video_duration_seconds / 60 * settings.credits_per_video_minute))
                    else:
                        credits_used = job.estimated_credits or 10
                    
                    # Deduct credits from user
                    if user.deduct_credits(credits_used, f"Video processing: {job.display_name}"):
                        job.actual_credits_used = credits_used
                        
                        # Record credit transaction
                        transaction = CreditTransaction(
                            user_id=user.id,
                            transaction_type="usage",
                            amount=-credits_used,
                            balance_after=user.credits_balance,
                            description=f"Video processing: {job.display_name}",
                            reference_type="video_job",
                            reference_id=str(job.id)
                        )
                        db.add(transaction)
                    
                    progress_callback(100, "Processing completed successfully")
                    
                    # Update job status
                    job.update_status(JobStatus.COMPLETED, "Video processing completed")
                    create_status_history(db, job, JobStatus.PROCESSING.value, JobStatus.COMPLETED.value, "Processing completed")
                    
                    db.commit()
                    
                    # Send completion notification
                    send_completion_notification.delay(str(user.id), job_id)
                    
                    # Schedule cleanup
                    cleanup_job.apply_async(args=[job_id], countdown=3600)  # 1 hour delay
                    
                    return {"success": True, "output_path": output_path}
                else:
                    raise Exception("Output file not found after processing")
            else:
                raise Exception("Ghostcut processing failed or timed out")
        else:
            raise Exception("Failed to submit job to Ghostcut API")
            
    except Exception as exc:
        logger.error(f"Video processing failed for job {job_id}: {exc}")
        
        # Update job status to failed
        try:
            job.update_status(JobStatus.FAILED, str(exc))
            create_status_history(db, job, job.status, JobStatus.FAILED.value, f"Processing failed: {str(exc)}")
            db.commit()
            
            # Send failure notification
            send_failure_notification.delay(str(user.id), job_id, str(exc))
            
        except Exception as db_error:
            logger.error(f"Failed to update job status: {db_error}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        else:
            return {"success": False, "error": str(exc)}
    
    finally:
        db.close()

@app.task(bind=True, max_retries=3)
def poll_ghostcut_completion(self, job_id: str, ghostcut_task_id: str):
    """
    Poll Ghostcut API for completion status
    """
    from video_processing import check_task_status, poll_for_results
    
    db = get_db()
    try:
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        if not job:
            return False
        
        # Load Ghostcut credentials
        ghostcut_config = {
            "app_key": settings.ghostcut_app_key,
            "app_secret": settings.ghostcut_app_secret,
        }
        
        if not all(ghostcut_config.values()):
            import json
            with open('zhaoli_config.json', 'r') as f:
                config = json.load(f)
                ghostcut_config.update(config)
        
        # Get output file path
        output_file = job.get_output_file()
        if not output_file:
            return False
        
        # Use existing polling function
        success = poll_for_results(
            app_key=ghostcut_config["app_key"],
            app_secret=ghostcut_config["app_secret"],
            task_id=ghostcut_task_id,
            output_path=output_file.storage_path,
            max_attempts=60,  # 30 minutes with 30-second intervals
            delay=30
        )
        
        return success
        
    except Exception as exc:
        logger.error(f"Error polling Ghostcut status: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60)
        return False
    finally:
        db.close()

@app.task
def cleanup_job(job_id: str):
    """
    Clean up temporary files for a job
    """
    db = get_db()
    try:
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        if not job:
            return
        
        # Clean up temporary files
        for file in job.files:
            if file.file_type == FileType.INPUT_VIDEO and file.storage_path:
                try:
                    if os.path.exists(file.storage_path):
                        os.remove(file.storage_path)
                        logger.info(f"Cleaned up input file: {file.storage_path}")
                except Exception as e:
                    logger.error(f"Error cleaning up file {file.storage_path}: {e}")
        
        logger.info(f"Cleanup completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"Error during cleanup for job {job_id}: {e}")
    finally:
        db.close()

@app.task
def cleanup_expired_files():
    """
    Periodic task to clean up expired files
    """
    db = get_db()
    try:
        expired_files = db.query(File).filter(
            File.expires_at < datetime.utcnow()
        ).all()
        
        for file in expired_files:
            try:
                if file.storage_path and os.path.exists(file.storage_path):
                    os.remove(file.storage_path)
                db.delete(file)
                logger.info(f"Cleaned up expired file: {file.filename}")
            except Exception as e:
                logger.error(f"Error cleaning up expired file {file.filename}: {e}")
        
        db.commit()
        logger.info(f"Cleaned up {len(expired_files)} expired files")
        
    except Exception as e:
        logger.error(f"Error during periodic file cleanup: {e}")
    finally:
        db.close()

@app.task
def send_completion_notification(user_id: str, job_id: str):
    """
    Send notification when job is completed
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

@app.task
def send_failure_notification(user_id: str, job_id: str, error_message: str):
    """
    Send notification when job fails
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

@app.task
def update_user_quotas():
    """
    Daily task to update user credit quotas based on subscription
    """
    db = get_db()
    try:
        from backend.models.user import SubscriptionTier
        
        # Get all active users with subscription tiers
        users = db.query(User).join(SubscriptionTier).filter(
            User.status == "active",
            SubscriptionTier.is_active == True
        ).all()
        
        for user in users:
            if user.subscription_tier.credits_per_month > 0:
                # Add monthly credits
                user.credits_balance += user.subscription_tier.credits_per_month
                
                # Record transaction
                transaction = CreditTransaction(
                    user_id=user.id,
                    transaction_type="bonus",
                    amount=user.subscription_tier.credits_per_month,
                    balance_after=user.credits_balance,
                    description=f"Monthly credit allocation: {user.subscription_tier.display_name}",
                    reference_type="subscription",
                    reference_id=str(user.subscription_tier.id)
                )
                db.add(transaction)
        
        db.commit()
        logger.info(f"Updated quotas for {len(users)} users")
        
    except Exception as e:
        logger.error(f"Error updating user quotas: {e}")
    finally:
        db.close()

@app.task
def check_long_running_jobs():
    """
    Check for jobs that have been running too long and verify their status with Zhaoli API
    before marking them as failed
    """
    db = get_db()
    try:
        timeout_minutes = settings.default_processing_timeout_minutes
        timeout_time = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        
        long_running_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.started_at < timeout_time
        ).all()
        
        actually_failed_jobs = []
        
        for job in long_running_jobs:
            # Before marking as failed, check the actual status with Zhaoli API
            if job.zhaoli_task_id:
                try:
                    from backend.services.ghostcut_client import GhostCutClient
                    client = GhostCutClient(
                        app_key=settings.ghostcut_api_key,
                        app_secret=settings.ghostcut_app_secret,
                        api_url=settings.ghostcut_api_url
                    )
                    
                    status_result = client.get_job_status(job.zhaoli_task_id)
                    
                    if status_result.get('status') == 'processing':
                        # Job is still actively processing, update progress and continue
                        progress = status_result.get('progress', 0)
                        message = status_result.get('message', 'Still processing...')
                        
                        job.progress_percentage = progress
                        job.progress_message = f"Long-running job still in progress: {message}"
                        logger.info(f"Job {job.id} is still processing at {progress}%")
                        continue
                        
                    elif status_result.get('status') == 'completed':
                        # Job actually completed, update status
                        job.update_status(JobStatus.COMPLETED, "Processing completed (detected during timeout check)")
                        create_status_history(db, job, JobStatus.PROCESSING.value, JobStatus.COMPLETED.value, "Completed during timeout check")
                        continue
                        
                except Exception as api_error:
                    logger.warning(f"Could not check Zhaoli status for job {job.id}: {api_error}")
                    # If we can't check status, proceed with timeout logic
            
            # If we reach here, the job is genuinely stuck or failed
            job.update_status(JobStatus.FAILED, f"Job timed out after {timeout_minutes} minutes (verified with API)")
            create_status_history(db, job, JobStatus.PROCESSING.value, JobStatus.FAILED.value, "Job timed out (API verified)")
            actually_failed_jobs.append(job)
            
            # Send failure notification
            send_failure_notification.delay(str(job.user_id), str(job.id), f"Job timed out after {timeout_minutes} minutes")
        
        db.commit()
        
        if actually_failed_jobs:
            logger.info(f"Marked {len(actually_failed_jobs)} truly long-running jobs as failed")
        if long_running_jobs:
            logger.info(f"Checked {len(long_running_jobs)} long-running jobs, {len(actually_failed_jobs)} actually failed")
            
    except Exception as e:
        logger.error(f"Error checking long-running jobs: {e}")
    finally:
        db.close()

@app.task
def update_processing_jobs_status():
    """
    Periodic task to update status of all processing jobs by checking with Zhaoli API
    This prevents frontend timeout issues by keeping job status current
    """
    db = get_db()
    try:
        processing_jobs = db.query(VideoJob).filter(
            VideoJob.status == JobStatus.PROCESSING.value,
            VideoJob.zhaoli_task_id.isnot(None)
        ).all()
        
        updated_count = 0
        completed_count = 0
        
        for job in processing_jobs:
            try:
                from backend.services.ghostcut_client import GhostCutClient
                client = GhostCutClient(
                    app_key=settings.ghostcut_api_key,
                    app_secret=settings.ghostcut_app_secret,
                    api_url=settings.ghostcut_api_url
                )
                
                status_result = client.get_job_status(job.zhaoli_task_id)
                
                if status_result.get('status') == 'completed':
                    # Job completed, update status
                    job.update_status(JobStatus.COMPLETED, "Processing completed successfully")
                    create_status_history(db, job, JobStatus.PROCESSING.value, JobStatus.COMPLETED.value, "Completed (auto-detected)")
                    completed_count += 1
                    
                    # Send completion notification
                    send_completion_notification.delay(str(job.user_id), str(job.id))
                    
                elif status_result.get('status') == 'processing':
                    # Update progress information
                    progress = status_result.get('progress', job.progress_percentage or 0)
                    message = status_result.get('message', 'Processing...')
                    
                    job.progress_percentage = progress
                    job.progress_message = message
                    updated_count += 1
                    
                elif status_result.get('status') == 'error':
                    # Job failed
                    error_msg = status_result.get('error', 'Unknown error from Zhaoli API')
                    job.update_status(JobStatus.FAILED, error_msg)
                    create_status_history(db, job, JobStatus.PROCESSING.value, JobStatus.FAILED.value, f"Failed: {error_msg}")
                    
                    # Send failure notification
                    send_failure_notification.delay(str(job.user_id), str(job.id), error_msg)
                    
            except Exception as api_error:
                logger.warning(f"Could not update status for job {job.id}: {api_error}")
                # Continue with other jobs even if one fails
                continue
        
        db.commit()
        
        if updated_count > 0 or completed_count > 0:
            logger.info(f"Updated {updated_count} processing jobs, {completed_count} completed")
            
    except Exception as e:
        logger.error(f"Error updating processing jobs status: {e}")
    finally:
        db.close()

def create_status_history(db: Session, job: VideoJob, old_status: str, new_status: str, message: str):
    """
    Create status history entry
    """
    history = JobStatusHistory(
        job_id=job.id,
        old_status=old_status,
        new_status=new_status,
        progress_percentage=job.progress_percentage,
        message=message
    )
    db.add(history)

# Queue job for processing (helper function)
def queue_video_processing_job(job_id: str):
    """
    Queue a video processing job
    """
    return process_video.delay(job_id)