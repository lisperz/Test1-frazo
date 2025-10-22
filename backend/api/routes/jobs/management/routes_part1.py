"""
Direct_process routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import datetime
import uuid
import os
import shutil
import logging
import asyncio
import aiohttp
import json
import hashlib

from backend.models.database import get_database, SessionLocal
from backend.models.user import User
from backend.models.file import File, FileType
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from backend.services.s3 import s3_service
from backend.config import settings

logger = logging.getLogger(__name__)

    import os
    debug_file = "/app/uploads/endpoint_debug.log"
    os.makedirs(os.path.dirname(debug_file), exist_ok=True)
    with open(debug_file, "a") as f:
        import datetime
        f.write(f"\n{'='*80}\n")
        f.write(f"Timestamp: {datetime.datetime.now()}\n")
        f.write(f"Endpoint called: /api/v1/direct/direct-process\n")
        f.write(f"File: {file.filename if file else 'No file'}\n")
        f.write(f"Effects received: {effects}\n")
        f.write(f"Effects type: {type(effects)}\n")
        f.write(f"Effects length: {len(effects) if effects else 0}\n")
        f.write(f"{'='*80}\n")

    # DEBUG: Always log when this endpoint is called
    logger.info("🔍 ENDPOINT CALLED - Checking effects parameter")
    logger.info(f"Effects provided: {effects is not None}")
    logger.info(f"Effects raw value: {repr(effects)}")

    # Show parameter conversion validation if effects are provided
    if effects:
        try:
            effects_data = json.loads(effects)

            # Use logger instead of print to ensure output appears in logs
            logger.info("\n" + "="*80)
            logger.info("🎯 PARAMETER CONVERSION VALIDATION")
            logger.info("="*80)
            logger.info(f"📥 FRONTEND PAYLOAD (Raw Effects):")
            logger.info(json.dumps(effects_data, indent=2))
            logger.info("="*80)

            # Convert to GhostCut format for validation
            video_inpaint_masks = []
            for effect in effects_data:
                if effect.get('type') == 'erasure':
                    region = effect.get('region', {})
                    if region and all(k in region for k in ['x', 'y', 'width', 'height']):
                        x1, y1 = region['x'], region['y']
                        x2, y2 = region['x'] + region['width'], region['y'] + region['height']

                        # Clamp and round to 2 decimal places
                        x1 = round(max(0.0, min(1.0, x1)), 2)
                        y1 = round(max(0.0, min(1.0, y1)), 2)
                        x2 = round(max(0.0, min(1.0, x2)), 2)
                        y2 = round(max(0.0, min(1.0, y2)), 2)

                        # Handle both startTime/endTime and startFrame/endFrame properties
                        start_time = effect.get('startTime') or effect.get('startFrame', 0)
                        end_time = effect.get('endTime') or effect.get('endFrame', 0)

                        mask_entry = {
                            "type": "remove",
                            "start": round(start_time, 2),
                            "end": round(end_time, 2),
                            "region": [
                                [x1, y1],  # Top-left
                                [x2, y1],  # Top-right
                                [x2, y2],  # Bottom-right
                                [x1, y2]   # Bottom-left
                            ]
                        }
                        video_inpaint_masks.append(mask_entry)

            logger.info("📤 CONVERTED PARAMETERS FOR GHOSTCUT:")
            logger.info(json.dumps(video_inpaint_masks, indent=2))
            logger.info("="*80)

        except json.JSONDecodeError as e:
            logger.error(f"❌ Error parsing effects JSON: {e}")
        except Exception as e:
            logger.error(f"❌ Error during parameter conversion: {e}")

    # Use authenticated user from JWT token
    logger.info(f"🔐 Processing video for user: {current_user.email} (ID: {current_user.id})")

    # Validate file
    if file.size and file.size > 2 * 1024 * 1024 * 1024:  # 2GB
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 2GB"
        )

    # Save file locally first
    file_id = uuid.uuid4()
    job_id = uuid.uuid4()
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{file_id}{file_extension}"

    upload_dir = os.path.join(settings.upload_path, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Parse effects data if provided
    effects_data = []
    if effects:
        logger.info(f"🔍 RAW EFFECTS STRING RECEIVED: {effects}")
        try:
            effects_data = json.loads(effects)

            # Show parameter conversion validation
            print("\n" + "="*80)
            print("🎯 PARAMETER CONVERSION VALIDATION")
            print("="*80)
            print(f"📥 FRONTEND PAYLOAD (Raw Effects):")
            print(json.dumps(effects_data, indent=2))
            print("="*80)

            # Convert to GhostCut format for validation
            video_inpaint_masks = []
            for effect in effects_data:
                if effect.get('type') == 'erasure':
                    region = effect.get('region', {})
                    if region and all(k in region for k in ['x', 'y', 'width', 'height']):
                        x1, y1 = region['x'], region['y']
                        x2, y2 = region['x'] + region['width'], region['y'] + region['height']

                        # Clamp and round to 2 decimal places
                        x1 = round(max(0.0, min(1.0, x1)), 2)
                        y1 = round(max(0.0, min(1.0, y1)), 2)
                        x2 = round(max(0.0, min(1.0, x2)), 2)
                        y2 = round(max(0.0, min(1.0, y2)), 2)

                        # Handle both startTime/endTime and startFrame/endFrame properties
                        start_time = effect.get('startTime') or effect.get('startFrame', 0)
                        end_time = effect.get('endTime') or effect.get('endFrame', 0)

                        mask_entry = {
                            "type": "remove",
                            "start": round(start_time, 2),
                            "end": round(end_time, 2),
                            "region": [
                                [x1, y1],  # Top-left
                                [x2, y1],  # Top-right
                                [x2, y2],  # Bottom-right
                                [x1, y2]   # Bottom-left
                            ]
                        }
                        video_inpaint_masks.append(mask_entry)

            print("\n✅ FINAL CONVERTED PARAMETERS FOR GHOSTCUT API:")
            print("="*80)
            print(f"needChineseOcclude: 2 (annotation area removal)")
            print(f"videoInpaintMasks: {json.dumps(video_inpaint_masks, indent=2)}")
            print("="*80 + "\n")

            # Force flush output
            import sys
            sys.stdout.flush()

            # Also log to logger
            logger.info(f"✅ CONVERTED PARAMETERS: needChineseOcclude=2, masks={json.dumps(video_inpaint_masks)}")

            # Write to file for debugging
            import os
            debug_file = "/app/uploads/parameter_conversion_debug.log"
            os.makedirs(os.path.dirname(debug_file), exist_ok=True)
            with open(debug_file, "a") as f:
                import datetime
                f.write(f"\n{'='*80}\n")
                f.write(f"Timestamp: {datetime.datetime.now()}\n")
                f.write(f"FRONTEND PAYLOAD:\n{json.dumps(effects_data, indent=2)}\n")
                f.write(f"\nCONVERTED PARAMETERS:\n")
                f.write(f"needChineseOcclude: 2\n")
                f.write(f"videoInpaintMasks:\n{json.dumps(video_inpaint_masks, indent=2)}\n")
                f.write(f"{'='*80}\n")

            logger.info(f"Parsed {len(effects_data)} effects for processing")
            logger.info(f"Effects data received: {effects_data}")
        except json.JSONDecodeError:
            logger.error(f"Invalid effects JSON: {effects}")
    else:
        logger.info("No effects data provided - will use full-screen processing")

    # Create database records
    db_file = File(
        id=file_id,
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_type=FileType.INPUT_VIDEO,
        mime_type=file.content_type,
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
        display_name=display_name or f"Text Removal - {file.filename}",
        status=JobStatus.QUEUED.value,
        processing_config={
            "type": "direct_ghostcut",
            "local_video_path": file_path,
            "video_file_id": str(file_id),
            "effects_data": effects_data,  # Store the parsed effects data
        },
        estimated_credits=10,
        queued_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(job)
    db.commit()

    # Process immediately (no Celery!)
    logger.info(f"Processing video {job_id} IMMEDIATELY without queue")

    try:
        # This runs asynchronously but doesn't block the response
        ghostcut_task_id = await process_video_immediately(
            str(job_id),
            file_path,
            db,
            background_tasks
        )

        return DirectProcessResponse(
            job_id=str(job_id),
            filename=file.filename,
            message="Video sent to GhostCut API immediately! Processing started.",
            status="processing",
            ghostcut_task_id=ghostcut_task_id
        )

    except Exception as e:
        logger.error(f"Failed to start processing: {e}")
        return DirectProcessResponse(
            job_id=str(job_id),
            filename=file.filename,
            message=f"Failed to start processing: {str(e)}",
            status="failed",
            ghostcut_task_id=None
        )


router = APIRouter()

