"""
Alternative Zhaoli API client implementation
"""

import requests
import logging
import hashlib
import time
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class ZhaoliClient:
    """Alternative client for Zhaoli API (if using instead of GhostCut)"""

    def __init__(self, app_key: str, app_secret: str) -> None:
        self.app_key = app_key
        self.app_secret = app_secret
        self.api_url = "https://api.zhaoli.com/v-w-c/gateway"
        self.session = requests.Session()

    def submit_job(
        self,
        video_url: str,
        **kwargs: Any
    ) -> str:
        """
        Submit video processing job

        Args:
            video_url: URL of video to process
            **kwargs: Additional parameters (callback_url, erasures, etc.)

        Returns:
            str: Job ID

        Raises:
            Exception: If API request fails
        """
        timestamp = int(time.time() * 1000)

        payload = {
            "appKey": self.app_key,
            "timestamp": timestamp,
            "sign": self._get_signature(timestamp),
            "url": video_url,
            "callbackUrl": kwargs.get("callback_url"),
            "videoTextEraseArea": kwargs.get("erasures", [])
        }

        response = self.session.post(
            f"{self.api_url}/ve/work/submit",
            json=payload
        )
        response.raise_for_status()

        result = response.json()
        if result.get("code") != 200:
            raise Exception(f"Zhaoli API error: {result.get('msg')}")

        return result["data"]["idProject"]

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get job status

        Args:
            job_id: Job ID to check

        Returns:
            dict: Job status information

        Raises:
            Exception: If API request fails
        """
        timestamp = int(time.time() * 1000)

        payload = {
            "appKey": self.app_key,
            "timestamp": timestamp,
            "sign": self._get_signature(timestamp),
            "idProjects": [job_id]
        }

        response = self.session.post(
            f"{self.api_url}/ve/work/status",
            json=payload
        )
        response.raise_for_status()

        result = response.json()
        if result.get("code") != 200:
            raise Exception(f"Zhaoli API error: {result.get('msg')}")

        job_data = result["data"][0] if result["data"] else {}

        status_map = {
            0: "processing",
            1: "completed",
            2: "failed"
        }

        return {
            "status": status_map.get(job_data.get("status"), "unknown"),
            "output_url": job_data.get("urlResult"),
            "progress": job_data.get("progress", 0),
            "error": job_data.get("errorMsg")
        }

    def _get_signature(self, timestamp: int) -> str:
        """
        Generate API signature

        Args:
            timestamp: Request timestamp

        Returns:
            str: MD5 signature
        """
        message = (
            f"appKey={self.app_key}&"
            f"appSecret={self.app_secret}&"
            f"timestamp={timestamp}"
        )
        return hashlib.md5(message.encode()).hexdigest()
