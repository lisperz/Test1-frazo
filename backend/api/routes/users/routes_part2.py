"""
Users routes - Part 2
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.models.database import get_database
from backend.models.user import User, APIKey, SubscriptionTier
from backend.models.job import VideoJob, JobStatus
from backend.auth.dependencies import get_current_user
from .schemas import SubscriptionTierResponse

router = APIRouter()


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