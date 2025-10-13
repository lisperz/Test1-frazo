"""
Pro Video Editor API routes for segment-based lip-sync processing
Handles multi-segment video processing with targeted audio inputs
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
import uuid
import logging
import tempfile
import shutil

from backend.models.database import get_database
from backend.models.user import User
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File, FileType
from backend.auth.dependencies import require_pro_tier, get_max_segments_for_user, get_current_user
from backend.services.s3_service import s3_service
from backend.services.sync_segments_service import sync_segments_service
from backend.api.schemas.pro_segments import (
    ProSyncProcessResponse,
    SegmentRequest,
    SegmentValidationError
)

logger = logging.getLogger(__name__)

router = APIRouter()


def validate_segments(segments: List[dict], video_duration: float, max_segments: int) -> Optional[List[SegmentValidationError]]:
    """
    Validate segment configurations

    Returns:
        None if valid, list of validation errors if invalid
    """
    errors = []

    # Check segment count
    if len(segments) > max_segments:
        errors.append({
            "segment_index": -1,
            "error_type": "COUNT_EXCEEDED",
            "error_message": f"Maximum {max_segments} segments allowed for your subscription tier"
        })

    # Check each segment
    for i, segment in enumerate(segments):
        start = segment.get("startTime", 0)
        end = segment.get("endTime", 0)

        # Validate time range
        if start < 0:
            errors.append({
                "segment_index": i,
                "error_type": "INVALID_START_TIME",
                "error_message": f"Segment {i+1}: Start time cannot be negative"
            })

        if end > video_duration:
            errors.append({
                "segment_index": i,
                "error_type": "INVALID_END_TIME",
                "error_message": f"Segment {i+1}: End time exceeds video duration ({video_duration}s)"
            })

        if start >= end:
            errors.append({
                "segment_index": i,
                "error_type": "INVALID_TIME_RANGE",
                "error_message": f"Segment {i+1}: Start time must be before end time"
            })

        # Minimum segment duration (0.5 seconds)
        if end - start < 0.5:
            errors.append({
                "segment_index": i,
                "error_type": "DURATION_TOO_SHORT",
                "error_message": f"Segment {i+1}: Minimum duration is 0.5 seconds"
            })

        # Check for overlaps with other segments
        for j, other_segment in enumerate(segments):
            if i != j:
                other_start = other_segment.get("startTime", 0)
                other_end = other_segment.get("endTime", 0)

                # Two segments overlap if: seg1.end > seg2.start AND seg1.start < seg2.end
                if end > other_start and start < other_end:
                    errors.append({
                        "segment_index": i,
                        "error_type": "SEGMENT_OVERLAP",
                        "error_message": f"Segment {i+1} overlaps with Segment {j+1}"
                    })

    return errors if errors else None


async def save_uploaded_file(upload_file: UploadFile, destination: str) -> str:
    """
    Save uploaded file to temporary location

    Returns:
        Path to saved file
    """
    try:
        os.makedirs(os.path.dirname(destination), exist_ok=True)

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        logger.info(f"Saved uploaded file to {destination}")
        return destination

    except Exception as e:
        logger.error(f"Error saving uploaded file: {e}")
        raise


@router.post("/pro-sync-process", response_model=ProSyncProcessResponse)
async def pro_sync_process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = FastAPIFile(..., description="Main video file"),
    audio_files: List[UploadFile] = FastAPIFile(..., description="Audio files for segments"),
    segments_data: str = Form(..., description="JSON array of segment configurations"),
    display_name: Optional[str] = Form(None, description="Optional job display name"),
    effects: Optional[str] = Form(None, description="JSON string of text removal effects"),
    current_user: User = Depends(require_pro_tier),
    db: Session = Depends(get_database)
):
    """
    Process video with multiple segments for targeted lip-sync

    Each segment specifies:
    - Time range (startTime, endTime) in the video
    - Audio file reference (refId) mapping to uploaded audio files
    - Optional audio cropping (audioInput.startTime, audioInput.endTime)

    Example segments_data:
    [
        {
            "startTime": 0.0,
            "endTime": 15.0,
            "audioInput": {"refId": "audio-1", "startTime": null, "endTime": null},
            "label": "Intro"
        },
        {
            "startTime": 15.0,
            "endTime": 30.0,
            "audioInput": {"refId": "audio-2", "startTime": 5.0, "endTime": 20.0},
            "label": "Main"
        }
    ]
    """
    try:
        # Parse segments data
        segments = json.loads(segments_data)
        logger.info(f"Received {len(segments)} segments for processing")

        # Validate Pro access and segment count
        max_segments = get_max_segments_for_user(current_user)

        if len(segments) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one segment is required"
            )

        if len(segments) > max_segments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your subscription allows maximum {max_segments} segments"
            )

        # Create job record
        job_id = uuid.uuid4()
        job = VideoJob(
            id=job_id,
            user_id=current_user.id,
            original_filename=file.filename,
            display_name=display_name or file.filename,
            status=JobStatus.UPLOADING.value,
            is_pro_job=True,
            segments_data={"segments": segments, "total_segments": len(segments)},
            processing_config={"effects": effects} if effects else {}
        )
        db.add(job)
        db.commit()

        logger.info(f"Created Pro job {job_id} with {len(segments)} segments")

        # Save video file temporarily
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"video_{job_id}_{file.filename}")
        await save_uploaded_file(file, video_path)

        # Save all audio files temporarily
        audio_paths = []
        for i, audio_file in enumerate(audio_files):
            audio_path = os.path.join(temp_dir, f"audio_{i}_{audio_file.filename}")
            await save_uploaded_file(audio_file, audio_path)
            audio_paths.append(audio_path)

        logger.info(f"Saved {len(audio_paths)} audio files temporarily")

        # Upload video to S3
        video_s3_key = f"users/{current_user.id}/jobs/{job_id}/video_{file.filename}"
        video_url = s3_service.upload_video_and_get_url(video_path, video_s3_key)

        if not video_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload video to S3"
            )

        # Upload all audio files to S3 and create refId mapping
        audio_url_mapping = s3_service.upload_multiple_audio_files(
            audio_paths,
            str(current_user.id),
            str(job_id)
        )

        logger.info(f"Uploaded {len(audio_url_mapping)} audio files to S3")

        # Clean up temporary files
        shutil.rmtree(temp_dir, ignore_errors=True)

        # Call Sync.so API to create segmented lip-sync generation
        try:
            logger.info(f"Calling Sync.so API for job {job_id} with {len(segments)} segments")

            sync_response = await sync_segments_service.create_segmented_lipsync(
                video_url=video_url,
                segments=segments,
                audio_url_mapping=audio_url_mapping
            )

            sync_generation_id = sync_response.get("id")
            logger.info(f"Sync.so generation created: {sync_generation_id}")

            # Update job with Sync.so generation ID and status
            job.status = JobStatus.PROCESSING.value
            job.job_metadata = {
                "video_s3_url": video_url,
                "audio_url_mapping": audio_url_mapping,
                "segments_count": len(segments),
                "sync_generation_id": sync_generation_id,
                "sync_response": sync_response
            }
            db.commit()

            logger.info(f"Pro job {job_id} successfully submitted to Sync.so")

            return ProSyncProcessResponse(
                job_id=str(job_id),
                sync_generation_id=sync_generation_id,
                segments_count=len(segments),
                status="processing",
                message=f"Pro job created successfully with {len(segments)} segments. Lip-sync generation started."
            )

        except Exception as e:
            logger.error(f"Failed to create Sync.so generation: {e}")

            # Update job status to failed
            job.status = JobStatus.FAILED.value
            job.progress_message = f"Failed to start lip-sync generation: {str(e)}"
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to start lip-sync generation: {str(e)}"
            )

    except json.JSONDecodeError as e:
        logger.error(f"Invalid segments JSON: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid segments_data JSON: {str(e)}"
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error in pro_sync_process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process Pro video: {str(e)}"
        )


@router.get("/pro-job/{job_id}/status")
async def get_pro_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Get status of a Pro video processing job
    """
    try:
        job = db.query(VideoJob).filter(
            VideoJob.id == uuid.UUID(job_id),
            VideoJob.user_id == current_user.id,
            VideoJob.is_pro_job == True
        ).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pro job not found"
            )

        return {
            "job_id": str(job.id),
            "status": job.status,
            "progress": job.progress_percentage,
            "message": job.progress_message,
            "segments_data": job.segments_data,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
            "output_url": job.output_url
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error getting Pro job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job status"
        )
