"""
User management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from backend.models.database import get_database
from backend.models.user import User, CreditTransaction, APIKey, SubscriptionTier
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from backend.auth.jwt_handler import JWTHandler
from sqlalchemy import func

router = APIRouter()

# Pydantic models
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

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        company=current_user.company,
        email_verified=current_user.email_verified,
        subscription_tier=current_user.subscription_tier.name,
        credits_balance=current_user.credits_balance,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at
    )

@router.get("/me/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user statistics"""
    
    # Get job counts by status
    total_jobs = db.query(VideoJob).filter(VideoJob.user_id == current_user.id).count()
    pending_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status.in_([JobStatus.QUEUED, JobStatus.PENDING])
    ).count()
    processing_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status == JobStatus.PROCESSING
    ).count()
    completed_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status == JobStatus.COMPLETED
    ).count()
    failed_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status == JobStatus.FAILED
    ).count()
    
    # Calculate success rate
    total_finished = completed_jobs + failed_jobs
    success_rate = (completed_jobs / total_finished * 100) if total_finished > 0 else 0.0
    
    # Get credits used this month (simplified - using total used credits for now)
    credits_used = db.query(func.coalesce(func.sum(CreditTransaction.amount), 0)).filter(
        CreditTransaction.user_id == current_user.id,
        CreditTransaction.transaction_type == "debit"
    ).scalar()
    
    return UserStatsResponse(
        total_jobs=total_jobs,
        pending_jobs=pending_jobs,
        processing_jobs=processing_jobs,
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        success_rate=round(success_rate, 1),
        credits_used_this_month=abs(credits_used) if credits_used else 0,
        monthly_credit_limit=current_user.subscription_tier.credits_per_month
    )

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile_data: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update current user profile"""
    
    # Update profile fields
    if profile_data.first_name is not None:
        current_user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        current_user.last_name = profile_data.last_name
    if profile_data.company is not None:
        current_user.company = profile_data.company
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        company=current_user.company,
        email_verified=current_user.email_verified,
        subscription_tier=current_user.subscription_tier.name,
        credits_balance=current_user.credits_balance,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at
    )

@router.get("/me/credits", response_model=List[CreditTransactionResponse])
async def get_credit_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user's credit transaction history"""
    
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(
        CreditTransaction.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return [
        CreditTransactionResponse(
            id=t.id,
            transaction_type=t.transaction_type,
            amount=t.amount,
            balance_after=t.balance_after,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]

@router.get("/me/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user's API keys"""
    
    api_keys = db.query(APIKey).filter(
        APIKey.user_id == current_user.id
    ).order_by(APIKey.created_at.desc()).all()
    
    return [
        APIKeyResponse(
            id=key.id,
            key_name=key.key_name,
            api_key_prefix=key.api_key_prefix,
            is_active=key.is_active,
            created_at=key.created_at,
            last_used_at=key.last_used_at,
            total_requests=key.total_requests
        )
        for key in api_keys
    ]

@router.post("/me/api-keys", response_model=dict)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create a new API key"""
    
    # Check if user already has too many API keys
    existing_keys = db.query(APIKey).filter(
        APIKey.user_id == current_user.id,
        APIKey.is_active == True
    ).count()
    
    if existing_keys >= 5:  # Limit to 5 active API keys
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum number of API keys reached (5)"
        )
    
    # Create new API key
    api_key_record, plain_key = APIKey.create_api_key(
        user_id=current_user.id,
        key_name=key_data.key_name
    )
    
    db.add(api_key_record)
    db.commit()
    
    return {
        "api_key": plain_key,
        "key_name": key_data.key_name,
        "message": "API key created successfully. Save this key securely - it won't be shown again."
    }

@router.delete("/me/api-keys/{key_id}")
async def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete an API key"""
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    db.delete(api_key)
    db.commit()
    
    return {"message": "API key deleted successfully"}

@router.put("/me/api-keys/{key_id}/toggle")
async def toggle_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Enable or disable an API key"""
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key.is_active = not api_key.is_active
    db.commit()
    
    status_text = "enabled" if api_key.is_active else "disabled"
    return {"message": f"API key {status_text} successfully"}

@router.get("/subscription-tiers", response_model=List[SubscriptionTierResponse])
async def get_subscription_tiers(
    db: Session = Depends(get_database)
):
    """Get available subscription tiers"""
    
    tiers = db.query(SubscriptionTier).filter(
        SubscriptionTier.is_active == True
    ).order_by(SubscriptionTier.price_monthly).all()
    
    return [
        SubscriptionTierResponse(
            id=tier.id,
            name=tier.name,
            display_name=tier.display_name,
            description=tier.description,
            price_monthly=float(tier.price_monthly),
            credits_per_month=tier.credits_per_month,
            max_video_length_seconds=tier.max_video_length_seconds,
            max_file_size_mb=tier.max_file_size_mb,
            max_concurrent_jobs=tier.max_concurrent_jobs,
            features=tier.features or []
        )
        for tier in tiers
    ]

@router.get("/me/usage-stats")
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get user usage statistics"""
    
    from backend.models.job import VideoJob, JobStatus
    from datetime import timedelta
    
    # Calculate stats for the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    total_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id
    ).count()
    
    jobs_last_30_days = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.created_at >= thirty_days_ago
    ).count()
    
    completed_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status == JobStatus.COMPLETED.value
    ).count()
    
    failed_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status == JobStatus.FAILED.value
    ).count()
    
    total_credits_used = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id,
        CreditTransaction.transaction_type == "usage"
    ).count()
    
    credits_used_last_30_days = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id,
        CreditTransaction.transaction_type == "usage",
        CreditTransaction.created_at >= thirty_days_ago
    ).count()
    
    return {
        "total_jobs": total_jobs,
        "jobs_last_30_days": jobs_last_30_days,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "success_rate": (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
        "total_credits_used": abs(total_credits_used),
        "credits_used_last_30_days": abs(credits_used_last_30_days),
        "current_credits": current_user.credits_balance,
        "subscription_tier": current_user.subscription_tier.display_name
    }

@router.post("/me/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Change user password"""
    
    # Verify current password
    if not current_user.check_password(current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Set new password
    current_user.set_password(new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.delete("/me")
async def delete_account(
    password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete user account"""
    
    # Verify password
    if not current_user.check_password(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    
    # Check for active jobs
    from backend.models.job import VideoJob, JobStatus
    active_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status.in_([JobStatus.QUEUED.value, JobStatus.PROCESSING.value])
    ).count()
    
    if active_jobs > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete account with {active_jobs} active jobs. Please wait for completion or cancel them."
        )
    
    # Mark account as deleted instead of actually deleting
    current_user.status = "deleted"
    current_user.email = f"deleted_{current_user.id}@deleted.local"
    
    db.commit()
    
    return {"message": "Account deleted successfully"}