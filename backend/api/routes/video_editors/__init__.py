"""
Video editors routes package
Includes GhostCut, Sync API, and Pro Sync API routes
"""

from fastapi import APIRouter

router = APIRouter()

# Import video editor sub-packages
try:
    from .ghostcut import router as ghostcut_router
    router.include_router(ghostcut_router)
except ImportError as e:
    import logging
    logging.warning(f"Could not import ghostcut routes: {e}")

try:
    from .sync import router as sync_router
    router.include_router(sync_router)
except ImportError as e:
    import logging
    logging.warning(f"Could not import sync routes: {e}")

__all__ = ["router"]
