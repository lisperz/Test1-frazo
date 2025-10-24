"""
Compatibility module - re-exports all handlers from auth_handlers and password_handlers
"""

from .auth_handlers import (
    handle_user_registration,
    handle_user_login,
    handle_token_refresh
)

from .password_handlers import (
    handle_logout,
    handle_email_verification,
    handle_password_reset_request,
    handle_password_reset_confirm,
    _build_user_response,
    _create_user_session
)

__all__ = [
    'handle_user_registration',
    'handle_user_login',
    'handle_token_refresh',
    'handle_logout',
    'handle_email_verification',
    'handle_password_reset_request',
    'handle_password_reset_confirm',
    '_build_user_response',
    '_create_user_session'
]
