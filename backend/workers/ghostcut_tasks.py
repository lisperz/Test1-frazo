"""
GhostCut video processing tasks - Main module

This module re-exports all GhostCut processing tasks for backward compatibility.
The implementation has been refactored into the ghostcut_tasks/ subdirectory.
"""

from backend.workers.ghostcut_tasks import (
    process_ghostcut_video,
    check_ghostcut_completion
)

__all__ = [
    'process_ghostcut_video',
    'check_ghostcut_completion'
]
