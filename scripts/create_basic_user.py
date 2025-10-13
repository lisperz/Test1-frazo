#!/usr/bin/env python3
"""
Create a basic (free tier) user account for testing
This script creates a user with 'free' subscription tier (subscription_tier_id = 1)
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.orm import Session
from backend.models.database import SessionLocal
from backend.models.user import User
import uuid


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
            return None

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
        print("\n")
