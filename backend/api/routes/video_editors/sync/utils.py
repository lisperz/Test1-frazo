"""
Utility functions for pro_sync_api routes
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)




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

