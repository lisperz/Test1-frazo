"""
Job management routes
Handles job creation, status, and lifecycle management
"""

from fastapi import APIRouter

router = APIRouter()

# Import jobs_original FIRST to ensure its routes are registered
import logging
logger = logging.getLogger(__name__)

try:
    from .jobs_original import router as jobs_original_router
    print(f"[JOBS DEBUG] jobs_original router has {len(jobs_original_router.routes)} routes")
    print(f"[JOBS DEBUG] jobs_original routes: {[r.path for r in jobs_original_router.routes if hasattr(r, 'path')]}")
    router.include_router(jobs_original_router)
    print(f"[JOBS DEBUG] After including jobs_original, management router has {len(router.routes)} routes")
    print(f"[JOBS DEBUG] Management routes: {[r.path for r in router.routes if hasattr(r, 'path')]}")
except Exception as e:
    import traceback
    print(f"[JOBS ERROR] Could not import jobs_original router: {e}")
    traceback.print_exc()

# Import individual route modules (these may have duplicate routes which will be ignored)
try:
    from .routes_part1 import router as jobs_router1
    from .routes_part2 import router as jobs_router2
    from .routes_part3 import router as jobs_router3

    router.include_router(jobs_router1)
    router.include_router(jobs_router2)
    router.include_router(jobs_router3)
except ImportError as e:
    import logging
    logging.warning(f"Could not import job management routes (parts 1-3): {e}")

__all__ = ["router"]
