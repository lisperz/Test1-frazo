"""
Helper functions for video task processing
"""

import logging
import os
import csv
import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.job import VideoJob, JobStatusHistory

logger = logging.getLogger(__name__)


def get_db():
    """Get database session"""
    from backend.models.database import SessionLocal
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session will be closed in finally block of calling function


def create_status_history(
    db: Session,
    job: VideoJob,
    old_status: str,
    new_status: str,
    message: str
) -> None:
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


def load_aws_credentials() -> Dict[str, str]:
    """
    Load AWS credentials from settings or CSV fallback
    """
    aws_access_key = settings.aws_access_key_id
    aws_secret_key = settings.aws_secret_access_key

    if not aws_access_key or not aws_secret_key:
        # Fallback to CSV method
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

    return {
        "access_key_id": aws_access_key,
        "secret_access_key": aws_secret_key,
        "region_name": settings.aws_region
    }


def load_ghostcut_config() -> Dict[str, str]:
    """
    Load Ghostcut credentials from config or JSON file
    """
    ghostcut_config = {
        "app_key": settings.ghostcut_app_key,
        "app_secret": settings.ghostcut_app_secret,
        "ghostcut_uid": settings.ghostcut_uid
    }

    if not all(ghostcut_config.values()):
        # Fallback to JSON config
        try:
            with open('zhaoli_config.json', 'r') as f:
                config = json.load(f)
                ghostcut_config.update(config)
        except Exception as e:
            logger.error(f"Could not load Ghostcut config: {e}")

    return ghostcut_config


def prepare_output_path(job: VideoJob, output_file) -> str:
    """
    Prepare output file path for processed video
    """
    output_path = os.path.join(
        settings.upload_temp_dir,
        str(job.user_id),
        "processed",
        output_file.filename
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    return output_path
