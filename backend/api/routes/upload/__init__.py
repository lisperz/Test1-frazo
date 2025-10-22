"""
Upload routes package
"""

from fastapi import APIRouter

router = APIRouter()

# Import upload routes
try:
    from .upload_and_process import router as upload_proc
    router.include_router(upload_proc)
except ImportError as e:
    import logging
    logging.warning(f"Could not import upload_and_process: {e}")

try:
    from .chunked_routes1 import router as chunked1
    router.include_router(chunked1)
except ImportError as e:
    import logging
    logging.warning(f"Could not import chunked_routes1: {e}")

try:
    from .chunked_routes2 import router as chunked2
    router.include_router(chunked2)
except ImportError as e:
    import logging
    logging.warning(f"Could not import chunked_routes2: {e}")

__all__ = ["router"]
