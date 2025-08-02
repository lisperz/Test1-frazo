"""
File management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import os
import mimetypes

from backend.models.database import get_database
from backend.models.user import User
from backend.models.file import File, FileAccessLog
from backend.auth.dependencies import get_current_user
from backend.config import settings

router = APIRouter()

# Pydantic models
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

@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Download a file"""
    
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
    
    # Check if file is expired
    if file.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File has expired"
        )
    
    # Check if file exists on disk
    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    # Log file access
    access_log = FileAccessLog(
        file_id=file.id,
        user_id=current_user.id,
        access_type="download",
        bytes_transferred=file.file_size_bytes
    )
    db.add(access_log)
    
    # Increment download count
    file.increment_download_count()
    db.commit()
    
    # Determine content type
    content_type = file.mime_type
    if not content_type:
        content_type, _ = mimetypes.guess_type(file.storage_path)
        content_type = content_type or "application/octet-stream"
    
    # Stream file response for large files
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

@router.get("/{file_id}/stream")
async def stream_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Stream a file (for video playback)"""
    
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
    
    # Check if file is expired
    if file.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File has expired"
        )
    
    # Check if file exists on disk
    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    # Log file access
    access_log = FileAccessLog(
        file_id=file.id,
        user_id=current_user.id,
        access_type="stream"
    )
    db.add(access_log)
    db.commit()
    
    # For streaming, use FileResponse which supports range requests
    return FileResponse(
        path=file.storage_path,
        media_type=file.mime_type or "video/mp4",
        filename=file.original_filename or file.filename
    )

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete a file"""
    
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
    
    # Check if file is associated with an active job
    if file.job and file.job.is_processing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete file associated with active job"
        )
    
    # Delete file from storage
    if os.path.exists(file.storage_path):
        try:
            os.remove(file.storage_path)
        except Exception as e:
            logger.warning(f"Failed to delete file from storage: {e}")
    
    # Delete file record
    db.delete(file)
    db.commit()
    
    return {"message": "File deleted successfully"}

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
    
    # Generate share token (simplified - in production use proper token generation)
    import secrets
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

@router.get("/shared/{share_token}")
async def download_shared_file(
    share_token: str,
    db: Session = Depends(get_database)
):
    """Download a shared file using share token"""
    
    # Find file with matching share token
    file = db.query(File).filter(
        File.metadata.op('->>')('share_token') == share_token
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared file not found"
        )
    
    # Check if share has expired
    share_expires_str = file.metadata.get("share_expires")
    if share_expires_str:
        share_expires = datetime.fromisoformat(share_expires_str)
        if datetime.utcnow() > share_expires:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Share link has expired"
            )
    
    # Check if file exists on disk
    if not os.path.exists(file.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage"
        )
    
    # Log anonymous access
    access_log = FileAccessLog(
        file_id=file.id,
        access_type="download",
        bytes_transferred=file.file_size_bytes
    )
    db.add(access_log)
    
    # Increment download count
    file.increment_download_count()
    db.commit()
    
    # Stream file
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

# Import required modules
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)