"""
S3 service module for video storage and management
"""

from backend.services.s3.service import S3Service, s3_service

__all__ = ["S3Service", "s3_service"]
