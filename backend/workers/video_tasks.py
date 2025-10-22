"""
Video processing tasks - Main module

This module re-exports all video processing tasks for backward compatibility.
The implementation has been refactored into the video_tasks/ subdirectory.
"""

from backend.workers.video_tasks import (
    process_video,
    poll_ghostcut_completion,
    cleanup_job,
    cleanup_expired_files_task as cleanup_expired_files,
    send_completion_notification,
    send_failure_notification,
    update_user_quotas,
    check_long_running_jobs,
    update_processing_jobs_status,
    check_pro_job_completion,
    queue_video_processing_job
)

__all__ = [
    'process_video',
    'poll_ghostcut_completion',
    'cleanup_job',
    'cleanup_expired_files',
    'send_completion_notification',
    'send_failure_notification',
    'update_user_quotas',
    'check_long_running_jobs',
    'update_processing_jobs_status',
    'check_pro_job_completion',
    'queue_video_processing_job'
]
