"""
Sync API routes for lip-sync video processing
"""

from fastapi import APIRouter

router = APIRouter()

# Import Sync API route modules
try:
    from .routes import router as sync_routes
    router.include_router(sync_routes)
except ImportError as e:
    import logging
    logging.warning(f"Could not import sync routes: {e}")

__all__ = ["router"]
