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
@router.get("/storage/usage")
async def get_storage_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user's storage usage statistics"""
