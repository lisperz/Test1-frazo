"""
Jobs routes package
Handles video processing job management and direct processing
"""

from fastapi import APIRouter

router = APIRouter()

# Import job sub-packages
try:
    from .management import router as management_router
    router.include_router(management_router)
except ImportError as e:
    import logging
    logging.warning(f"Could not import job management routes: {e}")

try:
    from .processing import router as processing_router
    router.include_router(processing_router)
except ImportError as e:
    import logging
    logging.warning(f"Could not import job processing routes: {e}")

__all__ = ["router"]
