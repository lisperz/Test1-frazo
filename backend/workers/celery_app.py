"""
Celery application configuration for video processing tasks
"""

from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure
import logging
import os

from backend.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
app = Celery('video_processor')

# Configure Celery
app.conf.update(
    broker_url=settings.celery_broker_url,
    result_backend=settings.celery_result_backend,
    
    # Task routing
    task_routes={
        'backend.workers.video_tasks.process_video': {'queue': 'video_processing'},
        'backend.workers.video_tasks.check_ghostcut_status': {'queue': 'status_checks'},
        'backend.workers.video_tasks.cleanup_job': {'queue': 'cleanup'},
        'backend.workers.video_tasks.send_notification': {'queue': 'notifications'}
    },
    
    # Task configuration
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Worker configuration
    worker_prefetch_multiplier=1,  # Process one task at a time for video processing
    task_acks_late=True,
    worker_max_tasks_per_child=10,  # Restart workers after 10 tasks to prevent memory leaks
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Task time limits
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    
    # Retry configuration
    task_default_retry_delay=60,  # 1 minute default retry delay
    task_max_retries=3,
    
    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'cleanup-expired-files': {
            'task': 'backend.workers.video_tasks.cleanup_expired_files',
            'schedule': 3600.0,  # Run every hour
        },
        'update-user-quotas': {
            'task': 'backend.workers.video_tasks.update_user_quotas',
            'schedule': 24 * 3600.0,  # Run daily
        },
        'check-long-running-jobs': {
            'task': 'backend.workers.video_tasks.check_long_running_jobs',
            'schedule': 300.0,  # Run every 5 minutes
        }
    }
)

# Task execution signals
@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **kwds):
    """Log task start"""
    logger.info(f"Task {task.name}[{task_id}] started with args={args}, kwargs={kwargs}")

@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, state=None, **kwds):
    """Log task completion"""
    logger.info(f"Task {task.name}[{task_id}] completed with state={state}")

@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None, einfo=None, **kwds):
    """Log task failure"""
    logger.error(f"Task {sender.name}[{task_id}] failed: {exception}")

# Import tasks to register them
from backend.workers import video_tasks

if __name__ == '__main__':
    app.start()