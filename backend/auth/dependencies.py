"""
Authentication dependencies for FastAPI
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uuid

from backend.models.database import get_database
from backend.models.user import User, UserSession, APIKey
from backend.auth.jwt_handler import JWTHandler

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_database)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = JWTHandler.decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except ValueError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for compatibility)
    """
    return current_user

async def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_database)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    """
    try:
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return None
        
        token = authorization.split(" ")[1]
        payload = JWTHandler.decode_token(token)
        user_id = payload.get("sub")
        
        if user_id:
            user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if user and user.status == "active":
                return user
    except Exception:
        pass
    
    return None

async def verify_api_key(
    request: Request,
    db: Session = Depends(get_database)
) -> User:
    """
    Verify API key authentication
    """
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Find API key in database
    api_key_record = db.query(APIKey).filter(
        APIKey.api_key_prefix == api_key[:8],
        APIKey.is_active == True
    ).first()
    
    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Verify the full API key
    if not JWTHandler.verify_api_key(api_key, api_key_record.api_key_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Check if API key is expired
    if not api_key_record.is_valid():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired"
        )
    
    # Update usage statistics
    api_key_record.last_used_at = datetime.utcnow()
    api_key_record.total_requests += 1
    db.commit()
    
    # Get the user
    user = db.query(User).filter(User.id == api_key_record.user_id).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )
    
    return user

async def get_user_from_token_or_api_key(
    request: Request,
    db: Session = Depends(get_database)
) -> User:
    """
    Authenticate user using either JWT token or API key
    """
    # Try JWT token first
    try:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            payload = JWTHandler.decode_token(token)
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            if user_id and token_type == "access":
                user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
                if user and user.status == "active":
                    return user
    except Exception:
        pass
    
    # Try API key
    try:
        return await verify_api_key(request, db)
    except HTTPException:
        pass
    
    # Neither authentication method worked
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Valid authentication required (JWT token or API key)"
    )

async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require admin privileges
    """
    # Check if user has admin role (you can implement role-based access)
    if not current_user.metadata.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return current_user

async def require_subscription_tier(min_tier: str = "pro"):
    """
    Require specific subscription tier
    """
    def check_tier(current_user: User = Depends(get_current_user)) -> User:
        tier_hierarchy = {"free": 1, "pro": 2, "enterprise": 3}
        
        user_tier_level = tier_hierarchy.get(current_user.subscription_tier.name, 0)
        required_level = tier_hierarchy.get(min_tier, 0)
        
        if user_tier_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription tier '{min_tier}' or higher required"
            )
        
        return current_user
    
    return check_tier

async def validate_user_limits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
) -> User:
    """
    Validate user has not exceeded their limits
    """
    from backend.models.job import VideoJob, JobStatus
    from datetime import datetime, timedelta
    
    # Check concurrent jobs
    concurrent_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.status.in_([JobStatus.QUEUED.value, JobStatus.PROCESSING.value])
    ).count()
    
    if concurrent_jobs >= current_user.subscription_tier.max_concurrent_jobs:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Maximum concurrent jobs ({current_user.subscription_tier.max_concurrent_jobs}) exceeded"
        )
    
    # Check daily job limit
    today = datetime.utcnow().date()
    daily_jobs = db.query(VideoJob).filter(
        VideoJob.user_id == current_user.id,
        VideoJob.created_at >= today,
        VideoJob.created_at < today + timedelta(days=1)
    ).count()
    
    daily_limit = current_user.subscription_tier.max_concurrent_jobs * 10  # 10x concurrent limit per day
    if daily_jobs >= daily_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily job limit ({daily_limit}) exceeded"
        )
    
    return current_user

# Import datetime for API key usage tracking
from datetime import datetime