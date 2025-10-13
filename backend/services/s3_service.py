"""
S3 service for uploading videos and managing file storage
Based on zhaoli_processor.py logic
"""

import boto3
import os
import time
import logging
from typing import Optional
from botocore.exceptions import ClientError, NoCredentialsError

from backend.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    """Service for handling S3 uploads and downloads"""
    
    def __init__(self):
        """Initialize S3 client with credentials from settings or hardcoded values"""
        try:
            # Get credentials from settings - must be provided via environment variables
            aws_key = settings.aws_access_key_id
            aws_secret = settings.aws_secret_access_key
            region = settings.aws_region or "us-east-1"
            bucket = settings.aws_s3_bucket or "your-s3-bucket-name"
            
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_key,
                aws_secret_access_key=aws_secret,
                region_name=region
            )
            self.bucket_name = bucket
            logger.info(f"S3 service initialized with bucket: {self.bucket_name}")
        except NoCredentialsError as e:
            logger.error("AWS credentials not found")
            raise e
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            raise e
    
    def upload_video_and_get_url(self, local_file_path: str, s3_key: Optional[str] = None) -> Optional[str]:
        """
        Upload a video file to S3 and return its public URL.
        
        Args:
            local_file_path: Path to the local video file
            s3_key: Optional custom key for S3 storage. If not provided, uses filename
            
        Returns:
            Public URL of the uploaded video, or None if upload failed
        """
        try:
            # Generate S3 key if not provided
            if not s3_key:
                s3_key = os.path.basename(local_file_path)
            
            # Ensure unique key by adding timestamp if needed
            if not self._is_unique_key(s3_key):
                name, ext = os.path.splitext(s3_key)
                s3_key = f"{name}_{int(time.time())}{ext}"
            
            logger.info(f"Uploading {local_file_path} to S3 bucket {self.bucket_name} with key {s3_key}")
            
            # Upload file with public-read ACL
            self.s3_client.upload_file(
                local_file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs={'ACL': 'public-read'}
            )
            
            # Generate public URL
            public_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            logger.info(f"Video uploaded successfully. Public URL: {public_url}")
            return public_url
            
        except FileNotFoundError:
            logger.error(f"Local file not found: {local_file_path}")
            return None
        except ClientError as e:
            logger.error(f"AWS S3 error during upload: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {e}")
            return None
    
    def download_file(self, s3_key: str, local_path: str) -> bool:
        """
        Download a file from S3 to local path.
        
        Args:
            s3_key: S3 object key
            local_path: Local path to save the file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure local directory exists
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            logger.info(f"Downloading {s3_key} from S3 to {local_path}")
            
            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                local_path
            )
            
            logger.info(f"Successfully downloaded file to {local_path}")
            return True
            
        except ClientError as e:
            logger.error(f"AWS S3 error during download: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 download: {e}")
            return False
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            s3_key: S3 object key to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Deleting {s3_key} from S3 bucket {self.bucket_name}")
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"Successfully deleted {s3_key} from S3")
            return True
            
        except ClientError as e:
            logger.error(f"AWS S3 error during deletion: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 deletion: {e}")
            return False
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3.
        
        Args:
            s3_key: S3 object key to check
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False
    
    def _is_unique_key(self, s3_key: str) -> bool:
        """Check if S3 key is unique (doesn't exist)"""
        return not self.file_exists(s3_key)
    
    def get_public_url(self, s3_key: str) -> str:
        """
        Get the public URL for an S3 object.
        
        Args:
            s3_key: S3 object key
            
        Returns:
            Public URL string
        """
        return f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
    
    def test_connection(self) -> bool:
        """
        Test S3 connection and permissions.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Try to list bucket objects (limit 1 for efficiency)
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                MaxKeys=1
            )
            logger.info("S3 connection test successful")
            return True
        except ClientError as e:
            logger.error(f"S3 connection test failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 connection test: {e}")
            return False

    def upload_multiple_audio_files(
        self,
        audio_file_paths: list,
        user_id: str,
        job_id: str
    ) -> dict:
        """
        Upload multiple audio files to S3 for Pro Video Editor segments

        Args:
            audio_file_paths: List of local audio file paths
            user_id: User ID for S3 path organization
            job_id: Job ID for S3 path organization

        Returns:
            Dict mapping refId -> S3 URL for each audio file
            Example: {"audio-uuid-1": "https://...", "audio-uuid-2": "https://..."}
        """
        import uuid

        url_mapping = {}

        try:
            for audio_file_path in audio_file_paths:
                if not os.path.exists(audio_file_path):
                    logger.warning(f"Audio file not found: {audio_file_path}")
                    continue

                # Generate unique refId for this audio file
                ref_id = f"audio-{uuid.uuid4()}"

                # Get file extension
                file_ext = os.path.splitext(audio_file_path)[1]

                # Create S3 key path
                s3_key = f"users/{user_id}/jobs/{job_id}/audio/{ref_id}{file_ext}"

                logger.info(f"Uploading audio file to S3: {s3_key}")

                # Upload to S3
                audio_url = self.upload_video_and_get_url(audio_file_path, s3_key)

                if audio_url:
                    url_mapping[ref_id] = audio_url
                    logger.info(f"Audio uploaded successfully: {ref_id} -> {audio_url}")
                else:
                    logger.error(f"Failed to upload audio file: {audio_file_path}")

            logger.info(f"Uploaded {len(url_mapping)} audio files to S3")
            return url_mapping

        except Exception as e:
            logger.error(f"Error uploading multiple audio files: {e}")
            raise

# Global S3 service instance
s3_service = S3Service()