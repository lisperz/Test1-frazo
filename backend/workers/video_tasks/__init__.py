"""
Video processing tasks module

This module provides video processing functionality with modular organization.
"""

# Import all public task functions
from backend.workers.video_tasks.core_tasks import (
    process_video,
    poll_ghostcut_completion,
    cleanup_job,
    cleanup_expired_files_task,
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
    'cleanup_expired_files_task',
    'send_completion_notification',
    'send_failure_notification',
    'update_user_quotas',
    'check_long_running_jobs',
    'update_processing_jobs_status',
    'check_pro_job_completion',
    'queue_video_processing_job'
]
