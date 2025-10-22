"""
Pydantic schemas for direct_process routes
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class DirectProcessResponse(BaseModel):
    job_id: str
    filename: str
    message: str
    status: str
    ghostcut_task_id: Optional[str] = None

class BatchProcessResponse(BaseModel):
    jobs: List[DirectProcessResponse]
    total_files: int
    message: str
