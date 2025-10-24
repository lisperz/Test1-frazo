"""
Admin routes - Part 1
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from backend.models.database import get_database
from backend.models.user import User, CreditTransaction, SubscriptionTier
from backend.models.job import VideoJob, JobStatus
from backend.models.file import File
from backend.auth.dependencies import require_admin
from backend.config import settings

router = APIRouter()


# Import schemas
try:
    from .schemas import SystemStats, UserAdminResponse, JobAdminResponse
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


@router.put("/users/{user_id}/credits")
async def adjust_user_credits(
    user_id: str,
    credits_adjustment: int,
    reason: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_database)
):
    """Adjust user's credit balance"""

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
