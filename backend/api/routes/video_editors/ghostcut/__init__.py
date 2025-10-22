"""
GhostCut API routes for video text inpainting
"""

from fastapi import APIRouter

router = APIRouter()

# Import GhostCut route modules
try:
    from .ghostcut_routes1 import router as ghostcut1
    router.include_router(ghostcut1)
except ImportError as e:
    import logging
    logging.warning(f"Could not import ghostcut_routes1: {e}")

try:
    from .ghostcut_routes2 import router as ghostcut2
    router.include_router(ghostcut2)
except ImportError as e:
    import logging
    logging.warning(f"Could not import ghostcut_routes2: {e}")

__all__ = ["router"]
