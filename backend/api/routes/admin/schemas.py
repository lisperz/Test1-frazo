"""
Pydantic schemas for admin routes
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class SystemStats(BaseModel):
    total_users: int
    active_users: int
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    processing_jobs: int
    total_files: int
    total_storage_mb: float
    revenue_this_month: float

class UserAdminResponse(BaseModel):
    id: str
    email: str
    full_name: str
    subscription_tier: str
    credits_balance: int
    status: str
    total_jobs: int
    created_at: datetime
    last_login_at: Optional[datetime]

class JobAdminResponse(BaseModel):
    id: str
    user_email: str
    original_filename: str
    status: str
    progress_percentage: int
    credits_used: Optional[int]
    created_at: datetime
    processing_duration_minutes: Optional[float]
