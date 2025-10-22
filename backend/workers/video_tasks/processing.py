"""
Video processing logic and external API integration
"""

import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
from sqlalchemy.orm import Session

from backend.models.user import User, CreditTransaction
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File, FileType
from backend.config import settings
from backend.workers.video_tasks.helpers import (
    load_aws_credentials,
    load_ghostcut_config,
    prepare_output_path
)

logger = logging.getLogger(__name__)


def upload_video_to_s3(
    input_file: File,
    progress_callback: Callable[[float, str], None]
) -> str:
    """
    Upload video to S3 and get public URL
    """
    from video_processing import upload_to_s3_and_get_url

    progress_callback(20, "Uploading to cloud storage")

    aws_creds = load_aws_credentials()

    video_url = upload_to_s3_and_get_url(
        video_path=input_file.storage_path,
        access_key_id=aws_creds["access_key_id"],
        secret_access_key=aws_creds["secret_access_key"]
    )

    if not video_url:
        raise Exception("Failed to upload video to S3")

    return video_url


def submit_to_ghostcut(
    video_url: str,
    job: VideoJob,
    db: Session,
    progress_callback: Callable[[float, str], None]
) -> Dict[str, Any]:
    """
    Submit video to Ghostcut API for processing
    """
    from video_processing import process_video as process_video_existing

    progress_callback(30, "Submitting to Ghostcut API")

    ghostcut_config = load_ghostcut_config()
    aws_creds = load_aws_credentials()

    input_file = job.get_input_file()

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
    output_path = prepare_output_path(job, output_file)

    progress_callback(40, "Processing video with AI text removal")

    # Call existing video processing function
    result = process_video_existing(
        input_path=input_file.storage_path,
        output_path=output_path,
        access_key_id=aws_creds["access_key_id"],
        secret_access_key=aws_creds["secret_access_key"],
        region_name=aws_creds["region_name"],
        selected_font="Arial.ttf",  # Default font
        use_zhaoli_api=True,
        app_key=ghostcut_config["app_key"],
        app_secret=ghostcut_config["app_secret"],
        ghostcut_uid=ghostcut_config["ghostcut_uid"]
    )

    return result


def poll_ghostcut_task(
    job_id: str,
    ghostcut_task_id: str
) -> bool:
    """
    Poll Ghostcut API for completion status
    """
    from video_processing import poll_for_results
    from backend.workers.video_tasks.helpers import get_db

    db = get_db()
    try:
        job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
        if not job:
            return False

        # Load Ghostcut credentials
        ghostcut_config = load_ghostcut_config()

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
        return False
    finally:
        db.close()


def finalize_processed_video(
    job: VideoJob,
    user: User,
    output_path: str,
    db: Session,
    progress_callback: Callable[[float, str], None]
) -> None:
    """
    Finalize the processed video and deduct credits
    """
    progress_callback(90, "Finalizing processed video")

    output_file = job.get_output_file()
    if not output_file or not os.path.exists(output_path):
        raise Exception("Output file not found after processing")

    # Update file information
    output_file.storage_path = output_path
    output_file.file_size_bytes = os.path.getsize(output_path)

    # Calculate actual credits used
    if job.video_duration_seconds:
        credits_used = max(
            1,
            int(job.video_duration_seconds / 60 * settings.credits_per_video_minute)
        )
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
    db.commit()


def cleanup_job_files(job_id: str) -> None:
    """
    Clean up temporary files for a job
    """
    from backend.workers.video_tasks.helpers import get_db

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


def cleanup_expired_files() -> None:
    """
    Periodic task to clean up expired files
    """
    from backend.workers.video_tasks.helpers import get_db

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
