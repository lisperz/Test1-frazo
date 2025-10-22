"""
Pydantic schemas for sync_api routes
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class SyncProcessResponse(BaseModel):
    job_id: str
    filename: str
    message: str
    status: str
    sync_generation_id: Optional[str] = None
