"""
Periodic tasks for checking job completion status
"""

from celery import Celery
from celery.schedules import crontab
from backend.workers.celery_app import app
from backend.workers.ghostcut_tasks import check_ghostcut_completion

# Configure periodic tasks
app.conf.beat_schedule = {
    'check-ghostcut-completion': {
        'task': 'backend.workers.ghostcut_tasks.check_ghostcut_completion',
        'schedule': 120.0,  # Run every 2 minutes
    },
}

# Ensure timezone awareness
app.conf.timezone = 'UTC'