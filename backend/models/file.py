"""
File management models
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
import os
from urllib.parse import urlparse

from .database import Base

class FileType:
    INPUT_VIDEO = "input_video"
    OUTPUT_VIDEO = "output_video"
    THUMBNAIL = "thumbnail"
    PREVIEW = "preview"

class StorageProvider:
    AWS_S3 = "aws_s3"
    GCP_STORAGE = "gcp_storage"
    LOCAL = "local"

class File(Base):
    __tablename__ = "files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("video_jobs.id", ondelete="CASCADE"))
    
    # File identification
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500))
    
    # File type and purpose
    file_type = Column(String(20), nullable=False)  # input_video, output_video, thumbnail, preview
    mime_type = Column(String(100))
    file_extension = Column(String(10))
    
    # Storage information
    storage_provider = Column(String(20), nullable=False, default=StorageProvider.AWS_S3)
    storage_path = Column(Text, nullable=False)  # Full path/URL to file
    storage_bucket = Column(String(255))
    storage_region = Column(String(50))
    
    # File metadata
    file_size_bytes = Column(BigInteger)
    checksum_md5 = Column(String(32))
    checksum_sha256 = Column(String(64))
    
    # Access control
    is_public = Column(Boolean, default=False)
    public_url = Column(Text)
    download_count = Column(Integer, default=0)
    expires_at = Column(DateTime)  # For temporary files
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    metadata = Column(JSONB, default=dict)
    
    # Relationships
    user = relationship("User", back_populates="files")
    job = relationship("VideoJob", back_populates="files")
    access_logs = relationship("FileAccessLog", back_populates="file", cascade="all, delete-orphan")
    
    @property
    def file_size_mb(self) -> float:
        """Get file size in MB"""
        if self.file_size_bytes:
            return self.file_size_bytes / (1024 * 1024)
        return 0.0
    
    @property
    def is_expired(self) -> bool:
        """Check if file has expired"""
        return self.expires_at and datetime.utcnow() > self.expires_at
    
    @property
    def is_video(self) -> bool:
        """Check if file is a video"""
        return self.file_type in [FileType.INPUT_VIDEO, FileType.OUTPUT_VIDEO]
    
    @property
    def is_image(self) -> bool:
        """Check if file is an image"""
        return self.file_type in [FileType.THUMBNAIL, FileType.PREVIEW]
    
    def generate_secure_filename(self, original_filename: str) -> str:
        """Generate a secure filename with UUID prefix"""
        # Extract file extension
        _, ext = os.path.splitext(original_filename)
        # Create secure filename with UUID
        secure_name = f"{uuid.uuid4()}{ext}"
        return secure_name
    
    def get_storage_path(self, user_id: uuid.UUID, file_type: str) -> str:
        """Generate storage path based on user and file type"""
        date_path = datetime.utcnow().strftime("%Y/%m/%d")
        return f"users/{user_id}/{file_type}/{date_path}/{self.filename}"
    
    def set_expiry(self, hours: int = 24):
        """Set file expiry time"""
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
    
    def generate_download_url(self, expires_in_seconds: int = 3600) -> str:
        """Generate a secure download URL (implementation depends on storage provider)"""
        # This would be implemented differently for each storage provider
        if self.storage_provider == StorageProvider.AWS_S3:
            # Would use boto3 to generate presigned URL
            return f"{self.storage_path}?expires={expires_in_seconds}"
        elif self.storage_provider == StorageProvider.LOCAL:
            # Local file serving through API
            return f"/api/v1/files/{self.id}/download"
        else:
            return self.storage_path
    
    def increment_download_count(self):
        """Increment download counter"""
        self.download_count += 1
    
    @classmethod
    def create_for_upload(cls, user_id: uuid.UUID, original_filename: str, 
                         file_type: str, job_id: uuid.UUID = None):
        """Create a new file record for upload"""
        file_instance = cls(
            user_id=user_id,
            job_id=job_id,
            original_filename=original_filename,
            file_type=file_type
        )
        
        # Generate secure filename
        file_instance.filename = file_instance.generate_secure_filename(original_filename)
        
        # Set file extension and mime type
        _, ext = os.path.splitext(original_filename)
        file_instance.file_extension = ext.lower()
        
        # Set mime type based on extension
        mime_types = {
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        file_instance.mime_type = mime_types.get(ext.lower(), 'application/octet-stream')
        
        # Generate storage path
        file_instance.storage_path = file_instance.get_storage_path(user_id, file_type)
        
        # Set default expiry for temporary files
        if file_type in [FileType.PREVIEW, FileType.THUMBNAIL]:
            file_instance.set_expiry(hours=168)  # 7 days for previews
        elif file_type == FileType.OUTPUT_VIDEO:
            file_instance.set_expiry(hours=720)  # 30 days for output videos
        
        return file_instance

class FileAccessLog(Base):
    __tablename__ = "file_access_logs"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    access_type = Column(String(20), nullable=False)  # download, view, stream
    ip_address = Column(String(45))  # Support IPv6
    user_agent = Column(Text)
    referer = Column(Text)
    bytes_transferred = Column(BigInteger)
    access_duration_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("File", back_populates="access_logs")
    user = relationship("User")

class FileCleanupJob(Base):
    __tablename__ = "file_cleanup_jobs"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    executed_at = Column(DateTime)
    status = Column(String(20), default="pending")  # pending, completed, failed
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("File")
    
    @classmethod
    def schedule_cleanup(cls, file_id: uuid.UUID, delay_hours: int = 24):
        """Schedule a file for cleanup"""
        cleanup_job = cls(
            file_id=file_id,
            scheduled_at=datetime.utcnow() + timedelta(hours=delay_hours)
        )
        return cleanup_job

# Storage quota tracking
class UserStorageQuota(Base):
    __tablename__ = "user_storage_quotas"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    used_bytes = Column(BigInteger, default=0)
    quota_bytes = Column(BigInteger, default=1073741824)  # 1GB default
    last_calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    @property
    def used_mb(self) -> float:
        """Get used storage in MB"""
        return self.used_bytes / (1024 * 1024)
    
    @property
    def quota_mb(self) -> float:
        """Get quota in MB"""
        return self.quota_bytes / (1024 * 1024)
    
    @property
    def usage_percentage(self) -> float:
        """Get usage as percentage"""
        if self.quota_bytes == 0:
            return 0.0
        return (self.used_bytes / self.quota_bytes) * 100
    
    @property
    def is_over_quota(self) -> bool:
        """Check if user is over quota"""
        return self.used_bytes > self.quota_bytes
    
    def can_upload(self, file_size_bytes: int) -> bool:
        """Check if user can upload a file of given size"""
        return (self.used_bytes + file_size_bytes) <= self.quota_bytes
    
    def add_usage(self, bytes_added: int):
        """Add to storage usage"""
        self.used_bytes += bytes_added
        self.last_calculated_at = datetime.utcnow()
    
    def remove_usage(self, bytes_removed: int):
        """Remove from storage usage"""
        self.used_bytes = max(0, self.used_bytes - bytes_removed)
        self.last_calculated_at = datetime.utcnow()

# Import to ensure models are available
from .user import User
from .job import VideoJob