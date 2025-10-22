"""
Users routes package
"""

from fastapi import APIRouter

try:
    from .routes_part1 import router as users_router1
    from .routes_part2 import router as users_router2

    router = APIRouter()
    router.include_router(users_router1)
    router.include_router(users_router2)
except ImportError:
    from .routes import router

__all__ = ["router"]
