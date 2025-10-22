"""
Admin routes for system management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from backend.models.database import get_database
from backend.models.user import User, CreditTransaction, SubscriptionTier
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File
from backend.auth.dependencies import require_admin
from backend.config import settings

router = APIRouter()

# Pydantic models
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
    
    import uuid
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update credits
    old_balance = user.credits_balance
    user.credits_balance += credits_adjustment
    
    # Ensure credits don't go negative
    if user.credits_balance < 0:
        user.credits_balance = 0
    
    # Record transaction
    transaction = CreditTransaction(
        user_id=user.id,
        transaction_type="bonus" if credits_adjustment > 0 else "usage",
        amount=credits_adjustment,
        balance_after=user.credits_balance,
        description=f"Admin adjustment: {reason}",
        reference_type="admin_adjustment",
        reference_id=str(admin_user.id)
    )
    
    db.add(transaction)
    db.commit()
    
    return {
        "message": f"Credits adjusted by {credits_adjustment}",
        "old_balance": old_balance,
        "new_balance": user.credits_balance
    }

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    new_status: str,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Update user account status"""
    
    import uuid
    
    valid_statuses = ["active", "suspended", "deleted"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_status = user.status
    user.status = new_status
    
    # Log status change in metadata
    if not user.metadata:
        user.metadata = {}
    
    if "status_history" not in user.metadata:
        user.metadata["status_history"] = []
    
    user.metadata["status_history"].append({
        "old_status": old_status,
        "new_status": new_status,
        "reason": reason,
        "changed_by": str(admin_user.id),
        "changed_at": datetime.utcnow().isoformat()
    })
    
    db.commit()
    
    return {
        "message": f"User status updated from {old_status} to {new_status}",
        "reason": reason
    }

@router.post("/jobs/{job_id}/cancel")
async def admin_cancel_job(
    job_id: str,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Cancel a job as admin"""
    
    import uuid
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    job = db.query(VideoJob).filter(VideoJob.id == job_uuid).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status in [JobStatus.COMPLETED.value, JobStatus.CANCELED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status: {job.status}"
        )
    
    # Cancel job
    job.update_status(JobStatus.CANCELED, f"Cancelled by admin: {reason}")
    
    # Log admin action
    if not job.metadata:
        job.metadata = {}
    
    job.metadata["admin_actions"] = job.metadata.get("admin_actions", [])
    job.metadata["admin_actions"].append({
        "action": "cancel",
        "reason": reason,
        "admin_id": str(admin_user.id),
        "timestamp": datetime.utcnow().isoformat()
    })
    
    db.commit()
    
    # TODO: Cancel background processing task
    # cancel_processing_task(job.id)
    
    return {"message": f"Job cancelled by admin: {reason}"}

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
    
    from sqlalchemy import text
    
    # Get daily job statistics
    query = text("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as total_jobs,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
            AVG(processing_duration_seconds) / 60.0 as avg_processing_minutes
        FROM video_jobs 
        WHERE created_at >= CURRENT_DATE - INTERVAL :days DAY
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    """)
    
    try:
        result = db.execute(query, {"days": days})
        daily_stats = [
            {
                "date": row.date.isoformat(),
                "total_jobs": row.total_jobs,
                "completed_jobs": row.completed_jobs,
                "failed_jobs": row.failed_jobs,
                "success_rate": (row.completed_jobs / row.total_jobs * 100) if row.total_jobs > 0 else 0,
                "avg_processing_minutes": round(row.avg_processing_minutes or 0, 2)
            }
            for row in result
        ]
    except Exception as e:
        # Fallback for SQLite or other databases
        daily_stats = []
    
    return {
        "daily_stats": daily_stats,
        "period_days": days
    }

@router.post("/maintenance")
async def set_maintenance_mode(
    enabled: bool,
    message: Optional[str] = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Enable or disable maintenance mode"""
    
    from backend.models.user import SystemSettings
    
    # Update maintenance mode setting
    maintenance_setting = db.query(SystemSettings).filter(
        SystemSettings.setting_key == "maintenance_mode"
    ).first()
    
    if maintenance_setting:
        maintenance_setting.setting_value = str(enabled).lower()
    else:
        maintenance_setting = SystemSettings(
            setting_key="maintenance_mode",
            setting_value=str(enabled).lower(),
            setting_type="boolean",
            description="System maintenance mode"
        )
        db.add(maintenance_setting)
    
    # Update maintenance message if provided
    if message:
        message_setting = db.query(SystemSettings).filter(
            SystemSettings.setting_key == "maintenance_message"
        ).first()
        
        if message_setting:
            message_setting.setting_value = message
        else:
            message_setting = SystemSettings(
                setting_key="maintenance_message",
                setting_value=message,
                setting_type="string",
                description="Maintenance mode message"
            )
            db.add(message_setting)
    
    db.commit()
    
    # Broadcast maintenance message to connected users
    if enabled:
        from backend.api.websocket import broadcast_maintenance_message
        broadcast_maintenance_message(
            message or "System is under maintenance. Please try again later."
        )
    
    return {
        "maintenance_mode": enabled,
        "message": message,
        "updated_by": admin_user.email
    }