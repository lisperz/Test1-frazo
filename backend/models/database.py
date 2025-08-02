"""
Database configuration and connection management
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/video_inpainting")

# For development with SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=True  # Set to False in production
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,
        echo=False  # Set to True for debugging SQL queries
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_database():
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """
    Initialize database tables
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

# Enable UUID extension for PostgreSQL
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

@event.listens_for(engine, "connect")
def set_postgresql_extensions(dbapi_connection, connection_record):
    if "postgresql" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
            cursor.execute("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"")
            dbapi_connection.commit()
        except Exception as e:
            logger.warning(f"Could not create PostgreSQL extensions: {e}")
        finally:
            cursor.close()