"""
Pydantic schemas for users routes
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserProfile(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    company: Optional[str]
    email_verified: bool
    subscription_tier: str
    credits_balance: int
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True

class CreditTransactionResponse(BaseModel):
    id: int
    transaction_type: str
    amount: int
    balance_after: int
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyResponse(BaseModel):
    id: int
    key_name: str
    api_key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime]
    total_requests: int

    class Config:
        from_attributes = True

class APIKeyCreate(BaseModel):
    key_name: str

class SubscriptionTierResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    price_monthly: float
    credits_per_month: int
    max_video_length_seconds: int
    max_file_size_mb: int
    max_concurrent_jobs: int
    features: List[str]

    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    total_jobs: int
    pending_jobs: int
    processing_jobs: int
    completed_jobs: int
    failed_jobs: int
    success_rate: float
    credits_used_this_month: int
    monthly_credit_limit: Optional[int]

    class Config:
        from_attributes = True
