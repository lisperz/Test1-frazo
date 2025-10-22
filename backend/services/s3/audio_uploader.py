"""
Audio file upload functionality for S3 service
"""

import os
import logging
import uuid
from typing import Dict, TYPE_CHECKING

from backend.services.s3.helpers import (
    validate_file_exists,
    create_s3_key_path
)

if TYPE_CHECKING:
    from backend.services.s3.service import S3Service

logger = logging.getLogger(__name__)


class AudioUploader:
    """Handles multi-file audio uploads to S3"""

    def __init__(self, s3_service: "S3Service") -> None:
        """
        Initialize audio uploader.

        Args:
            s3_service: S3Service instance to use for uploads
        """
        self.s3_service = s3_service

    def upload_multiple_files(
        self,
        audio_file_paths: list,
        user_id: str,
        job_id: str
    ) -> Dict[str, str]:
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
        url_mapping: Dict[str, str] = {}

        try:
            for audio_file_path in audio_file_paths:
                if not validate_file_exists(audio_file_path):
                    logger.warning(f"Audio file not found: {audio_file_path}")
                    continue

                ref_id = f"audio-{uuid.uuid4()}"
                file_ext = os.path.splitext(audio_file_path)[1]

                s3_key = create_s3_key_path(user_id, job_id, ref_id, file_ext)

                logger.info(f"Uploading audio file to S3: {s3_key}")

                audio_url = self.s3_service.upload_video_and_get_url(
                    audio_file_path,
                    s3_key
                )

                if audio_url:
                    url_mapping[ref_id] = audio_url
                    logger.info(f"Audio uploaded: {ref_id} -> {audio_url}")
                else:
                    logger.error(f"Failed to upload: {audio_file_path}")

            logger.info(f"Uploaded {len(url_mapping)} audio files to S3")
            return url_mapping

        except Exception as e:
            logger.error(f"Error uploading multiple audio files: {e}")
            raise

    def upload_files_with_refids(
        self,
        audio_refid_map: Dict[str, str],
        user_id: str,
        job_id: str
    ) -> Dict[str, str]:
        """
        Upload multiple audio files to S3 with preserved refIds from frontend

        Args:
            audio_refid_map: Dict mapping audio file path -> refId
                Example: {"/tmp/audio_0.mp3": "audio-1760661529869-tdshi62pu"}
            user_id: User ID for S3 path organization
            job_id: Job ID for S3 path organization

        Returns:
            Dict mapping refId -> S3 URL for each audio file
            Example: {"audio-1760661529869-tdshi62pu": "https://..."}
        """
        url_mapping: Dict[str, str] = {}

        try:
            for audio_file_path, ref_id in audio_refid_map.items():
                if not validate_file_exists(audio_file_path):
                    logger.warning(f"Audio file not found: {audio_file_path}")
                    continue

                file_ext = os.path.splitext(audio_file_path)[1]

                s3_key = create_s3_key_path(user_id, job_id, ref_id, file_ext)

                logger.info(
                    f"Uploading audio file to S3 with refId {ref_id}: {s3_key}"
                )

                audio_url = self.s3_service.upload_video_and_get_url(
                    audio_file_path,
                    s3_key
                )

                if audio_url:
                    url_mapping[ref_id] = audio_url
                    logger.info(f"Audio uploaded: {ref_id} -> {audio_url}")
                else:
                    logger.error(f"Failed to upload: {audio_file_path}")

            logger.info(
                f"Uploaded {len(url_mapping)} audio files to S3 "
                "with preserved refIds"
            )
            return url_mapping

        except Exception as e:
            logger.error(f"Error uploading audio files with refIds: {e}")
            raise
