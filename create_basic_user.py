#!/usr/bin/env python3
"""
Create a basic (free tier) user account for testing
Run this from the project root directory
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models.user import User
import uuid


# Database URL (update if needed)
DATABASE_URL = "postgresql://vti_user:vti_password_123@localhost:5432/video_text_inpainting"

# Create database engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_basic_user(email: str, password: str, first_name: str = None, last_name: str = None):
    """
    Create a basic user account with free tier subscription

    Args:
        email: User email (used for login)
        password: User password
        first_name: Optional first name
        last_name: Optional last name
    """
    db: Session = SessionLocal()

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email '{email}' already exists!")
            print(f"\n   You can still use these credentials:")
            print(f"   Email:    {email}")
            print(f"   Password: {password}")
            return existing_user

        # Create new user
        new_user = User(
            id=uuid.uuid4(),
            email=email,
            first_name=first_name,
            last_name=last_name,
            subscription_tier_id=1,  # Free tier (ID = 1)
            credits_balance=100,     # Free tier gets 100 credits
            email_verified=True,     # Skip email verification for testing
            status="active"
        )

        # Set password (hashed automatically)
        new_user.set_password(password)

        # Add to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print("✅ Basic user account created successfully!")
        print("\n" + "="*60)
        print("📋 ACCOUNT DETAILS (Share with your boss)")
        print("="*60)
        print(f"Email:              {email}")
        print(f"Password:           {password}")
        print(f"Subscription Tier:  Free (Basic)")
        print(f"Credits:            {new_user.credits_balance}")
        print(f"Access Level:       Basic Video Editor Only")
        print(f"User ID:            {new_user.id}")
        print("="*60)
        print("\n🔒 This user can ONLY access the Basic Video Editor")
        print("   (Pro Video Editor will show 'Upgrade' prompt)")
        print("\n")

        return new_user

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🎯 Creating Basic User Account for Testing\n")

    # Create account for boss
    email = "boss@example.com"
    password = "boss123"
    first_name = "Boss"
    last_name = "User"

    user = create_basic_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    if user:
        print("✅ Setup complete! Your boss can now log in and test the Basic Video Editor.")
        print("\n💡 Login URL: http://localhost:3000 (or your frontend URL)")
        print("\n📝 INSTRUCTIONS FOR YOUR BOSS:")
        print("   1. Go to http://localhost:3000")
        print("   2. Click 'Login' or navigate to login page")
        print("   3. Enter email: boss@example.com")
        print("   4. Enter password: boss123")
        print("   5. Access 'Video Editor' from sidebar")
        print("   6. This account has FREE tier access (Basic Editor only)")
        print("\n")
