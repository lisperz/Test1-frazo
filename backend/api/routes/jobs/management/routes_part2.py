@router.post("/direct-process", response_model=DirectProcessResponse)
async def direct_process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(...),
    display_name: Optional[str] = Form(None),
    effects: Optional[str] = Form(None),  # JSON string of effects data
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Process video IMMEDIATELY without Celery queue
    Video is sent to GhostCut API instantly
    """

    # BASIC DEBUG - This should ALWAYS appear when function is called
    logger.info("🟢 FUNCTION START - direct_process_video called")

    logger.info("🚀 DIRECT PROCESS ENDPOINT CALLED!")
    logger.info(f"📄 File: {file.filename if file else 'No file'}")
    logger.info(f"📊 Effects: {effects}")

    # Debug - write to file immediately when endpoint is called
@router.post("/batch-process", response_model=BatchProcessResponse)
async def batch_process_videos(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Process MULTIPLE videos simultaneously
    All videos are sent to GhostCut API immediately
    """

    # Use authenticated user from JWT token
    logger.info(f"🔐 Processing batch videos for user: {current_user.email} (ID: {current_user.id})")

    jobs = []

    for file in files:
        # Process each file
        try:
            # Save file
            file_id = uuid.uuid4()
            job_id = uuid.uuid4()
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{file_id}{file_extension}"

            upload_dir = os.path.join(settings.upload_path, str(current_user.id))
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, unique_filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Create records
            db_file = File(
                id=file_id,
                user_id=current_user.id,
                filename=unique_filename,
                original_filename=file.filename,
                file_type=FileType.INPUT_VIDEO,
                mime_type=file.content_type or "video/mp4",
                file_size_bytes=os.path.getsize(file_path),
                storage_path=file_path,
                storage_provider='local',
                is_public=False
            )
            db.add(db_file)

            job = VideoJob(
                id=job_id,
                user_id=current_user.id,
                original_filename=file.filename,
                display_name=f"Text Removal - {file.filename}",
                status=JobStatus.QUEUED.value,
                processing_config={
                    "type": "direct_ghostcut",
                    "local_video_path": file_path,
                    "video_file_id": str(file_id),
                },
                estimated_credits=10,
                queued_at=datetime.datetime.now(datetime.timezone.utc),
            )
            db.add(job)
            db.commit()

            # Process immediately
            ghostcut_task_id = await process_video_immediately(
                str(job_id),
                file_path,
                db,
                background_tasks
            )

            jobs.append(DirectProcessResponse(
                job_id=str(job_id),
                filename=file.filename,
                message="Processing started",
                status="processing",
                ghostcut_task_id=ghostcut_task_id
            ))

        except Exception as e:
            logger.error(f"Failed to process {file.filename}: {e}")
            jobs.append(DirectProcessResponse(
                job_id="",
                filename=file.filename,
                message=f"Failed: {str(e)}",
                status="failed",
                ghostcut_task_id=None
            ))

    return BatchProcessResponse(
        jobs=jobs,
        total_files=len(files),
        message=f"Processing {len([j for j in jobs if j.status == 'processing'])} videos"
    )

@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str, db: Session = Depends(get_database)):
    """
    Get real-time status of a processing job
    """

    job = db.query(VideoJob).filter(VideoJob.id == uuid.UUID(job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # If job has GhostCut task ID, check real status
    if job.zhaoli_task_id and job.status == JobStatus.PROCESSING.value:
        status = await check_ghostcut_status_async(job.zhaoli_task_id)

        # Update job with latest status
        if status["status"] == "completed":
            job.status = JobStatus.COMPLETED.value
            job.progress_percentage = 100
            job.progress_message = "Processing completed"
        elif status["status"] == "processing":
            job.progress_percentage = status.get("progress", 50)
            job.progress_message = f"Processing... {status.get('progress', 0)}%"

        db.commit()

    return {
        "job_id": str(job.id),
        "status": job.status,
        "progress": job.progress_percentage,
        "message": job.progress_message,
        "ghostcut_task_id": job.zhaoli_task_id,
        "created_at": job.created_at,
        "completed_at": job.completed_at
    }