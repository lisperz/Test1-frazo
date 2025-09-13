#!/usr/bin/env python3
"""
Script to create a new client user account
"""

import sys
import os
import uuid
from datetime import datetime
import bcrypt

# Add the backend directory to Python path
sys.path.append('/Users/zhuchen/Downloads/Test1-frazo')
sys.path.append('/Users/zhuchen/Downloads/Test1-frazo/backend')

try:
    from backend.models.database import SessionLocal
    from backend.models.user import User
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_client_user():
    """Create a new client user account"""
    
    # Client credentials
    email = "client@metafrazo.com"
    password = "ClientDemo2025!"
    first_name = "MetaFrazo"
    last_name = "Client"
    company = "MetaFrazo"
    credits_balance = 500  # Give them more credits
    
    print(f"Creating client user account:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Name: {first_name} {last_name}")
    print(f"Company: {company}")
    print(f"Credits: {credits_balance}")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"✅ User {email} already exists!")
            print(f"Current password: {password}")
            return existing_user.id
        
        # Hash the password
        password_hash = hash_password(password)
        
        # Create new user
        new_user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            company=company,
            credits_balance=credits_balance,
            email_verified=True,
            status='active',
            subscription_tier_id=2,  # Pro tier
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add to database
        db.add(new_user)
        db.commit()
        
        print(f"✅ Successfully created client user: {email}")
        print(f"User ID: {new_user.id}")
        
        return new_user.id
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return None
        
    finally:
        db.close()

if __name__ == "__main__":
    create_client_user()