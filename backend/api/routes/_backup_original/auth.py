"""
Authentication routes for user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid
from typing import Optional

from backend.models.database import get_database
from backend.models.user import User, UserSession, SubscriptionTier
from backend.auth.jwt_handler import JWTHandler
from backend.auth.dependencies import get_current_user
from backend.config import settings

router = APIRouter()
security = HTTPBearer()

# Pydantic models for request/response
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class EmailVerification(BaseModel):
    token: str

class TokenRefresh(BaseModel):
    refresh_token: str

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
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    request: Request,
    db: Session = Depends(get_database)
):
    """
    Register a new user account
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Get default subscription tier (free)
    default_tier = db.query(SubscriptionTier).filter(
        SubscriptionTier.name == "free"
    ).first()
    
    if not default_tier:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default subscription tier not found"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company=user_data.company,
        subscription_tier_id=default_tier.id,
        credits_balance=settings.default_credits_new_user
    )
    
    # Set password
    new_user.set_password(user_data.password)
    
    # Generate email verification token
    verification_token = new_user.generate_email_verification_token()
    
    # Save user
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create session
    session = UserSession.create_session(
        user_id=new_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    db.add(session)
    db.commit()
    
    # Create tokens
    access_token = JWTHandler.create_access_token({"sub": str(new_user.id)})
    refresh_token = JWTHandler.create_refresh_token({"sub": str(new_user.id)})
    
    # Update session with tokens
    session.session_token = access_token
    session.refresh_token = refresh_token
    db.commit()
    
    # TODO: Send verification email
    # await send_verification_email(new_user.email, verification_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            company=new_user.company,
            email_verified=new_user.email_verified,
            subscription_tier=new_user.subscription_tier.name,
            credits_balance=new_user.credits_balance,
            created_at=new_user.created_at
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_database)
):
    """
    Login user and return JWT tokens
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not user.check_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    
    # Update login information
    user.last_login_at = datetime.utcnow()
    user.login_count += 1
    
    # Create session
    session = UserSession.create_session(
        user_id=user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    db.add(session)
    
    # Create tokens
    access_token = JWTHandler.create_access_token({"sub": str(user.id)})
    refresh_token = JWTHandler.create_refresh_token({"sub": str(user.id)})
    
    # Update session with tokens
    session.session_token = access_token
    session.refresh_token = refresh_token
    
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            company=user.company,
            email_verified=user.email_verified,
            subscription_tier=user.subscription_tier.name,
            credits_balance=user.credits_balance,
            created_at=user.created_at
        )
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_database)
):
    """
    Refresh access token using refresh token
    """
    try:
        # Decode refresh token
        payload = JWTHandler.decode_token(token_data.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Find user and session
        user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
        if not user or user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        session = db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.refresh_token == token_data.refresh_token
        ).first()
        
        if not session or not session.is_valid():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Create new tokens
        new_access_token = JWTHandler.create_access_token({"sub": str(user.id)})
        new_refresh_token = JWTHandler.create_refresh_token({"sub": str(user.id)})
        
        # Update session
        session.session_token = new_access_token
        session.refresh_token = new_refresh_token
        session.refresh()
        
        db.commit()
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                company=user.company,
                email_verified=user.email_verified,
                subscription_tier=user.subscription_tier.name,
                credits_balance=user.credits_balance,
                created_at=user.created_at
            )
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """
    Logout user and invalidate session
    """
    # Find and delete all user sessions
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).all()
    
    for session in sessions:
        db.delete(session)
    
    db.commit()
    
    return {"message": "Successfully logged out"}

@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerification,
    db: Session = Depends(get_database)
):
    """
    Verify user email address
    """
    email = JWTHandler.verify_email_token(verification_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Verify email
    user.email_verified = True
    user.email_verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/password-reset")
async def request_password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_database)
):
    """
    Request password reset
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        # Don't reveal if email exists - always return success
        return {"message": "If an account with that email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = JWTHandler.create_password_reset_token(user.email)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    db.commit()
    
    # TODO: Send password reset email
    # await send_password_reset_email(user.email, reset_token)
    
    return {"message": "If an account with that email exists, a reset link has been sent"}

@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_database)
):
    """
    Confirm password reset with new password
    """
    email = JWTHandler.verify_password_reset_token(reset_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Reset password
    user.set_password(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    
    # Invalidate all existing sessions
    sessions = db.query(UserSession).filter(UserSession.user_id == user.id).all()
    for session in sessions:
        db.delete(session)
    
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        company=current_user.company,
        email_verified=current_user.email_verified,
        subscription_tier=current_user.subscription_tier.name,
        credits_balance=current_user.credits_balance,
        created_at=current_user.created_at
    )