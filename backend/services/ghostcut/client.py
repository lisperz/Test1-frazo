"""GhostCut API client for video text inpainting"""

import requests
import logging
import hashlib
import time
import json
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class GhostCutClient:
    """Client for interacting with Zhaoli API (GhostCut backend)"""

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        api_url: str = "https://api.zhaoli.com"
    ) -> None:
        self.app_key = api_key
        self.app_secret = api_secret
        self.api_url = api_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json"
        })

    def submit_job(
        self,
        video_url: str,
        ghostcut_uid: str,
        language: str = "auto",
        erasures: Optional[List[Dict]] = None,
        protected_areas: Optional[List[Dict]] = None,
        text_areas: Optional[List[Dict]] = None,
        auto_detect_text: bool = False
    ) -> str:
        """
        Submit a video processing job to Zhaoli API (GhostCut backend)

        Args:
            video_url: URL of the video to process
            ghostcut_uid: GhostCut UID (required)
            language: Language detection setting (default: "auto")
            erasures: List of erasure areas (optional)
            protected_areas: List of protected areas (optional)
            text_areas: List of text areas (optional)
            auto_detect_text: Enable automatic text detection

        Returns:
            str: Job ID from Zhaoli API

        Raises:
            Exception: If API request fails
        """
        url = f"{self.api_url}/v-w-c/gateway/ve/work/free"

        request_data = {
            "urls": [video_url],
            "uid": ghostcut_uid,
            "workName": f"Processed_video_{int(time.time())}",
            "resolution": "1080p",
            "needChineseOcclude": 1,
            "videoInpaintLang": "all"
        }

        body = json.dumps(request_data)
        sign = self._calculate_signature(body)

        headers = {
            'Content-type': 'application/json',
            'AppKey': self.app_key,
            'AppSign': sign,
        }

        logger.info(f"Submitting job to Zhaoli API: {url}")
        logger.info(f"Request data: {json.dumps(request_data, indent=2)}")

        try:
            response = self.session.post(
                url,
                json=request_data,
                headers=headers,
                timeout=30
            )

            logger.info(f"Response Status Code: {response.status_code}")
            logger.info(f"Response Text: {response.text}")

            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")

            result = response.json()
            logger.info(f"Response JSON: {result}")

            if result.get("code") == 1000:
                job_id = self._extract_job_id(result)
                logger.info(f"Zhaoli API job submitted successfully: {job_id}")
                return str(job_id)
            else:
                error_msg = result.get('msg', 'Unknown error')
                raise Exception(f"Zhaoli API error: {error_msg}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to submit job to Zhaoli API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise Exception(f"Zhaoli API error: {e}")

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a Zhaoli API job

        Args:
            job_id: Job ID to check

        Returns:
            dict: Job status information with keys:
                - status: Current job status
                - progress: Processing progress (0-100)
                - message: Status message
                - output_url: URL of processed video (if completed)
                - error: Error message (if failed)
        """
        try:
            url = f"{self.api_url}/v-w-c/gateway/ve/work/status"

            request_data = {
                "idProjects": [int(job_id)]
            }

            body = json.dumps(request_data)
            sign = self._calculate_signature(body)

            headers = {
                'Content-type': 'application/json',
                'AppKey': self.app_key,
                'AppSign': sign,
            }

            logger.info(f"Checking status for job ID: {job_id}")

            response = self.session.post(
                url,
                json=request_data,
                headers=headers,
                timeout=30
            )

            logger.info(f"Status Response Code: {response.status_code}")
            logger.info(f"Status Response Text: {response.text}")

            if response.status_code != 200:
                return {'status': 'error', 'error': f'HTTP {response.status_code}'}

            result = response.json()
            logger.info(f"Status Response JSON: {result}")

            if result.get("code") == 1000:
                return self._parse_job_status(result)
            else:
                error_msg = result.get('msg', 'Unknown error')
                logger.error(f"API request failed: {error_msg}")
                return {'status': 'error', 'error': error_msg}

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get job status from Zhaoli API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return {'status': 'error', 'error': f'Request failed: {str(e)}'}

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a GhostCut job

        Args:
            job_id: Job ID to cancel

        Returns:
            bool: True if cancelled successfully
        """
        try:
            response = self.session.post(
                f"{self.api_url}/v1/video/inpaint/cancel/{job_id}",
                timeout=30
            )
            response.raise_for_status()

            logger.info(f"GhostCut job {job_id} cancelled successfully")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to cancel GhostCut job: {e}")
            return False

    def test_connection(self) -> bool:
        """Test connection to GhostCut API"""
        try:
            response = self.session.get(f"{self.api_url}/health", timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def _calculate_signature(self, body: str) -> str:
        """Calculate MD5 signature for API request"""
        md5_1 = hashlib.md5()
        md5_1.update(body.encode('utf-8'))
        body_md5hex = md5_1.hexdigest()

        md5_2 = hashlib.md5()
        body_md5hex = (body_md5hex + self.app_secret).encode('utf-8')
        md5_2.update(body_md5hex)

        return md5_2.hexdigest()

    def _extract_job_id(self, result: Dict[str, Any]) -> str:
        """Extract job ID from API response"""
        body_data = result.get("body", {})

        job_id = body_data.get("idProject")

        if not job_id:
            data_list = body_data.get("dataList", [])
            if data_list and len(data_list) > 0:
                job_id = data_list[0].get("id")

        if not job_id:
            raise ValueError(f"No job ID in response: {result}")

        return job_id

    def _parse_job_status(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Parse job status from API response"""
        body_data = result.get("body", {})
        content = body_data.get("content", [])

        if not content:
            return {'status': 'no_data', 'error': 'No task data found'}

        task_data = content[0]

        process_status = task_data.get("processStatus", 0)
        process_progress = task_data.get("processProgress", 0.0)
        video_url = task_data.get("videoUrl", "")
        deleted = task_data.get("deleted", 0)

        logger.info(
            f"Process Status: {process_status}, "
            f"Progress: {process_progress}%, URL: {video_url}"
        )

        if deleted == 1:
            status = 'deleted'
        elif process_progress >= 100.0:
            status = 'completed'
        elif process_progress > 0:
            status = 'processing'
        else:
            status = 'pending'

        return {
            "status": status,
            "progress": int(process_progress),
            "message": f"Processing {process_progress}% complete",
            "output_url": video_url,
            "error": None
        }
