"""
Admin routes - Part 2
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from backend.models.database import get_database
from backend.models.user import User, CreditTransaction, SubscriptionTier
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File
from backend.auth.dependencies import require_admin

logger = logging.getLogger(__name__)

router = APIRouter()


# Import schemas from routes_part1
try:
    from .routes_part1 import SystemStats, UserAdminResponse, JobAdminResponse
except ImportError:
    # Define minimal schemas if not available
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
        full_name: Optional[str]
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


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Get system-wide statistics"""

    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "active").count()

    # Job statistics
    total_jobs = db.query(VideoJob).count()
    completed_jobs = db.query(VideoJob).filter(VideoJob.status == JobStatus.COMPLETED.value).count()
    failed_jobs = db.query(VideoJob).filter(VideoJob.status == JobStatus.FAILED.value).count()
    processing_jobs = db.query(VideoJob).filter(
        VideoJob.status.in_([JobStatus.QUEUED.value, JobStatus.PROCESSING.value])
    ).count()

    # File statistics
    total_files = db.query(File).count()
    total_storage_bytes = db.query(func.sum(File.file_size_bytes)).scalar() or 0
    total_storage_mb = total_storage_bytes / (1024 * 1024)

    # Revenue calculation (simplified)
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_transactions = db.query(CreditTransaction).filter(
        CreditTransaction.transaction_type == "purchase",
        CreditTransaction.created_at >= current_month
    ).all()

    # Estimate revenue (this would need to be calculated based on actual payment data)
    revenue_this_month = len(revenue_transactions) * 10.0  # Simplified calculation

    return SystemStats(
        total_users=total_users,
        active_users=active_users,
        total_jobs=total_jobs,
        completed_jobs=completed_jobs,
        failed_jobs=failed_jobs,
        processing_jobs=processing_jobs,
        total_files=total_files,
        total_storage_mb=round(total_storage_mb, 2),
        revenue_this_month=revenue_this_month
    )

@router.get("/users", response_model=List[UserAdminResponse])
async def get_all_users(
    page: int = 1,
    page_size: int = 50,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Get all users with admin details"""

    # Build query
    query = db.query(User).join(SubscriptionTier)

    # Apply filters
    if status_filter:
        query = query.filter(User.status == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()

    # Get job counts for each user
    user_responses = []
    for user in users:
        job_count = db.query(VideoJob).filter(VideoJob.user_id == user.id).count()

        user_responses.append(UserAdminResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            subscription_tier=user.subscription_tier.display_name,
            credits_balance=user.credits_balance,
            status=user.status,
            total_jobs=job_count,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        ))

    return user_responses

@router.get("/jobs", response_model=List[JobAdminResponse])
async def get_all_jobs(
    page: int = 1,
    page_size: int = 50,
    status_filter: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Get all jobs with admin details"""

    # Build query
    query = db.query(VideoJob).join(User)

    # Apply status filter
    if status_filter:
        query = query.filter(VideoJob.status == status_filter)

    # Apply pagination
    offset = (page - 1) * page_size
    jobs = query.order_by(VideoJob.created_at.desc()).offset(offset).limit(page_size).all()

    return [
        JobAdminResponse(
            id=str(job.id),
            user_email=job.user.email,
            original_filename=job.original_filename,
            status=job.status,
            progress_percentage=job.progress_percentage,
            credits_used=job.actual_credits_used,
            created_at=job.created_at,
            processing_duration_minutes=job.processing_time_minutes
        )
        for job in jobs
    ]

@router.put("/users/{user_id}/credits")
async def adjust_user_credits(
    user_id: str,
    credits_adjustment: int,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Adjust user's credit balance"""

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    new_status: str,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Update user account status"""

@router.post("/jobs/{job_id}/cancel")
async def admin_cancel_job(
    job_id: str,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Cancel a job as admin"""

@router.get("/system/health")
async def system_health_check(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Get detailed system health information"""

    # Database health
    try:
        db.execute("SELECT 1")
        db_healthy = True
        db_error = None
    except Exception as e:
        db_healthy = False
        db_error = str(e)

    # Check processing queue health
    processing_jobs = db.query(VideoJob).filter(
        VideoJob.status == JobStatus.PROCESSING.value
    ).count()

    # Check for stuck jobs (processing for > 1 hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    stuck_jobs = db.query(VideoJob).filter(
        VideoJob.status == JobStatus.PROCESSING.value,
        VideoJob.started_at < one_hour_ago
    ).count()

    # Storage health
    try:
        import shutil
        disk_usage = shutil.disk_usage(settings.upload_temp_dir)
        storage_healthy = True
        storage_free_gb = disk_usage.free / (1024**3)
        storage_error = None
    except Exception as e:
        storage_healthy = False
        storage_free_gb = 0
        storage_error = str(e)

    return {
        "database": {
            "healthy": db_healthy,
            "error": db_error
        },
        "processing_queue": {
            "active_jobs": processing_jobs,
            "stuck_jobs": stuck_jobs,
            "healthy": stuck_jobs < 5  # Arbitrary threshold
        },
        "storage": {
            "healthy": storage_healthy,
            "free_space_gb": round(storage_free_gb, 2),
            "error": storage_error
        },
        "overall_healthy": db_healthy and storage_healthy and stuck_jobs < 5
    }


@router.get("/analytics/daily")
async def get_daily_analytics(
    days: int = 30,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Get daily analytics for the last N days"""
    # Placeholder implementation
    return {
        "daily_stats": [],
        "period_days": days,
        "message": "Analytics feature not yet fully implemented"
    }


@router.post("/maintenance")
async def set_maintenance_mode(
    enabled: bool,
    message: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Enable or disable maintenance mode"""
    # Placeholder implementation
    return {
        "maintenance_mode": enabled,
        "message": message or "Maintenance mode updated",
        "updated_by": admin_user.email
    }
