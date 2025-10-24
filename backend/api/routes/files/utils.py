"""
Utility functions for files routes
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)


def create_file_download_response(file, content_type: str = "application/octet-stream"):
    """
    Create a streaming response for file download

    Args:
        file: File model instance
        content_type: MIME type for the response

    Returns:
        StreamingResponse for file download
    """
    def generate_file_stream():
        with open(file.storage_path, "rb") as file_obj:
            while chunk := file_obj.read(8192):  # 8KB chunks
                yield chunk

    headers = {
        "Content-Disposition": f'attachment; filename="{file.original_filename or file.filename}"',
    }

    if file.file_size_bytes:
        headers["Content-Length"] = str(file.file_size_bytes)

    return StreamingResponse(
        generate_file_stream(),
        media_type=content_type,
        headers=headers
    )


def get_file_mime_type(filename: str) -> str:
    """
    Determine MIME type from filename extension

    Args:
        filename: The filename to check

    Returns:
        MIME type string
    """
    import mimetypes
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"
