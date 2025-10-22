"""
GhostCut video processing tasks module

This module provides GhostCut video processing functionality with modular organization.
"""

# Import all public task functions
from backend.workers.ghostcut_tasks.tasks import (
    process_ghostcut_video,
    check_ghostcut_completion
)

__all__ = [
    'process_ghostcut_video',
    'check_ghostcut_completion'
]
