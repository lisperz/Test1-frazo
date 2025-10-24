"""
Files routes - Part 1
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import mimetypes
import shutil
import secrets
import logging

from backend.models.database import get_database
from backend.models.user import User
from backend.models.file import File, FileAccessLog
from backend.auth.dependencies import get_current_user
from backend.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# Import or define schemas
try:
    from .schemas import FileUploadResponse, FileListResponse, FileResponse as FileResponseSchema
    FileResponse = FileResponseSchema
except ImportError:
    class FileUploadResponse(BaseModel):
        file_id: str
        url: str
        message: str

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

    class FileListResponse(BaseModel):
        files: List[FileResponse]
        total: int
        page: int
        page_size: int


@router.post("/{file_id}/share")
async def share_file(
    file_id: str,
    expires_hours: int = 24,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Generate a public share link for a file"""

    try:
        file_uuid = uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format"
        )

    file = db.query(File).filter(
        File.id == file_uuid,
        File.user_id == current_user.id
    ).first()

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check limits on sharing (optional)
    if expires_hours > 168:  # Max 7 days
        expires_hours = 168

    # Generate share token
    share_token = secrets.token_urlsafe(32)

    # Store share token in file metadata
    if not file.metadata:
        file.metadata = {}

    file.metadata["share_token"] = share_token
    file.metadata["share_expires"] = (datetime.utcnow() + timedelta(hours=expires_hours)).isoformat()

    db.commit()

    share_url = f"/api/v1/files/shared/{share_token}"

    return {
        "share_url": share_url,
        "expires_at": file.metadata["share_expires"],
        "message": f"File will be publicly accessible for {expires_hours} hours"
    }


@router.get("/storage/usage")
async def get_storage_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user's storage usage statistics"""

    from backend.models.file import UserStorageQuota

    # Get or create storage quota record
    quota = db.query(UserStorageQuota).filter(
        UserStorageQuota.user_id == current_user.id
    ).first()

    if not quota:
        quota = UserStorageQuota(
            user_id=current_user.id,
            used_bytes=0,
            quota_bytes=1 * 1024 * 1024 * 1024  # 1GB default
        )
        db.add(quota)
        db.commit()

    # Calculate actual usage
    total_size = db.query(
        db.func.sum(File.file_size_bytes)
    ).filter(
        File.user_id == current_user.id,
        File.expires_at.is_(None) or File.expires_at > datetime.utcnow()
    ).scalar() or 0

    # Update quota if different
    if quota.used_bytes != total_size:
        quota.used_bytes = total_size
        quota.last_calculated_at = datetime.utcnow()
        db.commit()

    return {
        "used_bytes": quota.used_bytes,
        "used_mb": quota.used_mb,
        "quota_bytes": quota.quota_bytes,
        "quota_mb": quota.quota_mb,
        "usage_percentage": quota.usage_percentage,
        "is_over_quota": quota.is_over_quota,
        "files_count": db.query(File).filter(File.user_id == current_user.id).count()
    }


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Upload a file"""

    # Validate file size (max 2GB)
    max_size = 2 * 1024 * 1024 * 1024  # 2GB
    if file.size and file.size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum of 2GB"
        )

    # Validate file type for videos
    allowed_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}"
        )

    # Generate unique filename
    file_id = uuid.uuid4()
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_id}{file_extension}"

    # Ensure upload directory exists
    upload_dir = os.path.join(settings.upload_path, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)

    # Save file to disk
    file_path = os.path.join(upload_dir, unique_filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Get file size
    file_size = os.path.getsize(file_path)

    # Create database record
    db_file = File(
        id=file_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type='video',
        mime_type=file.content_type,
        file_size_bytes=file_size,
        storage_path=file_path,
        storage_provider='local',  # Using local storage for now
        is_public=False
    )

    db.add(db_file)
    db.commit()

    # Generate URL for the file
    file_url = f"{settings.api_base_url}/api/v1/files/{file_id}/download"

    return FileUploadResponse(
        file_id=str(file_id),
        url=file_url,
        message="File uploaded successfully"
    )

@router.get("/", response_model=FileListResponse)
async def get_user_files(
    page: int = 1,
    page_size: int = 20,
    file_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user's files with pagination"""

    # Build query
    query = db.query(File).filter(File.user_id == current_user.id)

    # Apply file type filter
    if file_type:
        query = query.filter(File.file_type == file_type)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    files = query.order_by(File.created_at.desc()).offset(offset).limit(page_size).all()

    # Convert to response format
    file_responses = [
        FileResponse(
            id=str(file.id),
            filename=file.filename,
            original_filename=file.original_filename or file.filename,
            file_type=file.file_type,
            mime_type=file.mime_type,
            file_size_mb=file.file_size_mb,
            is_public=file.is_public,
            download_count=file.download_count,
            created_at=file.created_at,
            expires_at=file.expires_at
        )
        for file in files
    ]

    return FileListResponse(
        files=file_responses,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{file_id}", response_model=FileResponse)
async def get_file_info(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get file information"""

    try:
        file_uuid = uuid.UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID format"
        )

    file = db.query(File).filter(
        File.id == file_uuid,
        File.user_id == current_user.id
    ).first()

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return FileResponse(
        id=str(file.id),
        filename=file.filename,
        original_filename=file.original_filename or file.filename,
        file_type=file.file_type,
        mime_type=file.mime_type,
        file_size_mb=file.file_size_mb,
        is_public=file.is_public,
        download_count=file.download_count,
        created_at=file.created_at,
        expires_at=file.expires_at
    )
