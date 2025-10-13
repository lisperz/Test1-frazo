"""
Pydantic schemas for Pro Video Editor segment-based lip-sync API
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class AudioInputRequest(BaseModel):
    """Audio input configuration for a segment"""
    refId: str = Field(..., description="Unique reference ID for audio file mapping")
    startTime: Optional[float] = Field(None, description="Optional audio crop start time (seconds)")
    endTime: Optional[float] = Field(None, description="Optional audio crop end time (seconds)")

    @validator('startTime', 'endTime')
    def validate_time(cls, v):
        if v is not None and v < 0:
            raise ValueError("Time cannot be negative")
        return v

    @validator('endTime')
    def validate_end_after_start(cls, v, values):
        if v is not None and 'startTime' in values and values['startTime'] is not None:
            if v <= values['startTime']:
                raise ValueError("endTime must be greater than startTime")
        return v


class SegmentRequest(BaseModel):
    """Segment configuration for Pro lip-sync processing"""
    startTime: float = Field(..., description="Segment start time in video (seconds)")
    endTime: float = Field(..., description="Segment end time in video (seconds)")
    audioInput: AudioInputRequest = Field(..., description="Audio configuration for this segment")
    label: Optional[str] = Field(None, description="Optional user-defined segment label")

    @validator('startTime', 'endTime')
    def validate_time(cls, v):
        if v < 0:
            raise ValueError("Time cannot be negative")
        return v

    @validator('endTime')
    def validate_end_after_start(cls, v, values):
        if 'startTime' in values and v <= values['startTime']:
            raise ValueError("endTime must be greater than startTime")
        return v


class ProSyncProcessRequest(BaseModel):
    """Request model for pro-sync-process endpoint"""
    segments: List[SegmentRequest] = Field(..., description="Array of segments to process")
    display_name: Optional[str] = Field(None, description="Optional display name for the job")
    effects: Optional[str] = Field(None, description="JSON string of text removal effects")

    @validator('segments')
    def validate_segments(cls, v):
        if not v:
            raise ValueError("At least one segment is required")
        if len(v) > 10:
            raise ValueError("Maximum 10 segments allowed")
        return v


class ProSyncProcessResponse(BaseModel):
    """Response model for pro-sync-process endpoint"""
    job_id: str = Field(..., description="Unique job ID for tracking")
    sync_generation_id: Optional[str] = Field(None, description="Sync.so generation ID")
    segments_count: int = Field(..., description="Number of segments in the job")
    status: str = Field(..., description="Job status")
    message: str = Field(..., description="Status message")


class SegmentJobStatus(BaseModel):
    """Detailed status for a segmented job"""
    job_id: str
    status: str
    progress: int = Field(..., ge=0, le=100)
    message: str
    segments_data: Optional[dict] = None
    sync_generation_id: Optional[str] = None
    final_output_url: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class SegmentValidationError(BaseModel):
    """Error model for segment validation failures"""
    segment_index: int
    error_type: str
    error_message: str
