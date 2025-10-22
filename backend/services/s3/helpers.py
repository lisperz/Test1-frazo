"""
Helper functions for S3 service operations
"""

import os
import time
from typing import Callable


def validate_file_exists(file_path: str) -> bool:
    """
    Validate that a file exists at the given path.

    Args:
        file_path: Path to the file to check

    Returns:
        True if file exists, False otherwise
    """
    return os.path.exists(file_path) and os.path.isfile(file_path)


def ensure_unique_key(
    s3_key: str,
    file_exists_check: Callable[[str], bool]
) -> str:
    """
    Ensure S3 key is unique by adding timestamp if needed.

    Args:
        s3_key: Original S3 key
        file_exists_check: Function to check if key exists

    Returns:
        Unique S3 key
    """
    if not file_exists_check(s3_key):
        return s3_key

    name, ext = os.path.splitext(s3_key)
    return f"{name}_{int(time.time())}{ext}"


def create_s3_key_path(
    user_id: str,
    job_id: str,
    ref_id: str,
    file_ext: str
) -> str:
    """
    Create structured S3 key path for audio files.

    Args:
        user_id: User ID for organization
        job_id: Job ID for organization
        ref_id: Reference ID for the file
        file_ext: File extension (e.g., '.mp3')

    Returns:
        Formatted S3 key path
    """
    return f"users/{user_id}/jobs/{job_id}/audio/{ref_id}{file_ext}"
