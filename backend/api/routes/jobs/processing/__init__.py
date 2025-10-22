"""
Video processing routes for direct processing
Handles immediate video processing without job queue
"""

from fastapi import APIRouter

router = APIRouter()

# Processing routes are optional, import if available
try:
    from .direct_process_original import router as direct_process_router
    router.include_router(direct_process_router)
except ImportError as e:
    import logging
    logging.warning(f"Could not import direct_process routes: {e}")

__all__ = ["router"]
