"""
Utility functions for files routes
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)



# Pydantic models
    def generate_file_stream():
        with open(file.storage_path, "rb") as file_obj:
            while chunk := file_obj.read(8192):  # 8KB chunks
                yield chunk

    headers = {
        "Content-Disposition": f'attachment; filename="{file.original_filename or file.filename}"',
        "Content-Length": str(file.file_size_bytes) if file.file_size_bytes else None
    }

    return StreamingResponse(
        generate_file_stream(),
        media_type=content_type,
        headers=headers
    )

    def generate_file_stream():
        with open(file.storage_path, "rb") as file_obj:
            while chunk := file_obj.read(8192):
                yield chunk

    headers = {
        "Content-Disposition": f'attachment; filename="{file.original_filename or file.filename}"'
    }

    return StreamingResponse(
        generate_file_stream(),
        media_type=file.mime_type or "application/octet-stream",
        headers=headers
    )
