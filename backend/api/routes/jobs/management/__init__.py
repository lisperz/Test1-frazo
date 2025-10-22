"""
Job management routes
Handles job creation, status, and lifecycle management
"""

from fastapi import APIRouter

router = APIRouter()

# Import individual route modules
try:
    from .routes_part1 import router as jobs_router1
    from .routes_part2 import router as jobs_router2
    from .routes_part3 import router as jobs_router3

    router.include_router(jobs_router1)
    router.include_router(jobs_router2)
    router.include_router(jobs_router3)
except ImportError as e:
    import logging
    logging.warning(f"Could not import job management routes: {e}")

__all__ = ["router"]
