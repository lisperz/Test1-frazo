"""
Pydantic schemas for files routes
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class FileResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    mime_type: Optional[str]
    file_size_mb: float
    is_public: bool
    download_count: int
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True

class FileListResponse(BaseModel):
    files: List[FileResponse]
    total: int
    page: int
    page_size: int

class FileUploadResponse(BaseModel):
    file_id: str
    url: str
    message: str
