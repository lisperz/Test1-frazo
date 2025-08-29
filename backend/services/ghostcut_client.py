"""
Zhaoli API client for video text inpainting (GhostCut backend)
"""

import requests
import logging
from typing import Dict, Any, List, Optional
import hashlib
import time
import json

logger = logging.getLogger(__name__)

class GhostCutClient:
    """Client for interacting with Zhaoli API (GhostCut backend)"""
    
    def __init__(self, api_key: str, api_secret: str, api_url: str = "https://api.zhaoli.com"):
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
        erasures: List[Dict] = None,
        protected_areas: List[Dict] = None,
        text_areas: List[Dict] = None,
        auto_detect_text: bool = False
    ) -> str:
        """
        Submit a video processing job to Zhaoli API (GhostCut backend)
        
        Returns:
            str: Job ID from Zhaoli API
        """
        
        # Use the correct Zhaoli API endpoint for text removal
        url = f"{self.api_url}/v-w-c/gateway/ve/work/free"
        
        # Prepare the request data with correct parameters
        request_data = {
            "urls": [video_url],  # Array of video URLs to process
            "uid": ghostcut_uid,  # GhostCut UID (required)
            "workName": f"Processed_video_{int(time.time())}",
            "resolution": "1080p",
            "needChineseOcclude": 1,  # Full-screen erase with automatic text detection
            "videoInpaintLang": "all"  # Remove all languages
        }
        
        body = json.dumps(request_data)
        
        # Calculate signature using MD5 hash
        md5_1 = hashlib.md5()
        md5_1.update(body.encode('utf-8'))
        body_md5hex = md5_1.hexdigest()
        md5_2 = hashlib.md5()
        body_md5hex = (body_md5hex + self.app_secret).encode('utf-8')
        md5_2.update(body_md5hex)
        sign = md5_2.hexdigest()
        
        headers = {
            'Content-type': 'application/json',
            'AppKey': self.app_key,
            'AppSign': sign,
        }
        
        logger.info(f"Submitting job to Zhaoli API: {url}")
        logger.info(f"Request data: {json.dumps(request_data, indent=2)}")
        
        try:
            response = self.session.post(url, json=request_data, headers=headers, timeout=30)
            
            logger.info(f"Response Status Code: {response.status_code}")
            logger.info(f"Response Text: {response.text}")
            
            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")
            
            result = response.json()
            logger.info(f"Response JSON: {result}")
            
            # Check if request was successful
            if result.get("code") == 1000:
                body_data = result.get("body", {})
                
                # Extract task ID from response
                job_id = body_data.get("idProject")
                
                if not job_id:
                    # Fallback: try to extract from dataList
                    data_list = body_data.get("dataList", [])
                    if data_list and len(data_list) > 0:
                        job_id = data_list[0].get("id")
                
                if not job_id:
                    raise ValueError(f"No job ID in response: {result}")
                
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
        
        Returns:
            dict: Job status information
        """
        
        try:
            # Use the correct Zhaoli API endpoint for status checking
            url = f"{self.api_url}/v-w-c/gateway/ve/work/status"
            
            # Prepare request data with correct format
            request_data = {
                "idProjects": [int(job_id)]  # Convert to int and put in list
            }
            
            body = json.dumps(request_data)
            
            # Calculate signature
            md5_1 = hashlib.md5()
            md5_1.update(body.encode('utf-8'))
            body_md5hex = md5_1.hexdigest()
            md5_2 = hashlib.md5()
            body_md5hex = (body_md5hex + self.app_secret).encode('utf-8')
            md5_2.update(body_md5hex)
            sign = md5_2.hexdigest()
            
            headers = {
                'Content-type': 'application/json',
                'AppKey': self.app_key,
                'AppSign': sign,
            }
            
            logger.info(f"Checking status for job ID: {job_id}")
            
            response = self.session.post(url, json=request_data, headers=headers, timeout=30)
            
            logger.info(f"Status Response Code: {response.status_code}")
            logger.info(f"Status Response Text: {response.text}")
            
            if response.status_code != 200:
                return {'status': 'error', 'error': f'HTTP {response.status_code}'}
            
            result = response.json()
            logger.info(f"Status Response JSON: {result}")
            
            # Check if response is successful
            if result.get("code") == 1000:
                body_data = result.get("body", {})
                content = body_data.get("content", [])
                
                if not content:
                    return {'status': 'no_data', 'error': 'No task data found'}
                
                # Get the first task (should be our task)
                task_data = content[0]
                
                # Extract information
                process_status = task_data.get("processStatus", 0)
                process_progress = task_data.get("processProgress", 0.0)
                video_url = task_data.get("videoUrl", "")
                deleted = task_data.get("deleted", 0)
                
                logger.info(f"Process Status: {process_status}")
                logger.info(f"Process Progress: {process_progress}%")
                logger.info(f"Video URL: {video_url}")
                
                # Determine status based on processStatus and progress
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
    
    def _add_signature(self, payload: Dict) -> Dict:
        """
        Add signature to request if required by API
        """
        # Some APIs require HMAC signature
        # Implement based on GhostCut documentation
        
        # Example implementation (adjust based on actual API requirements):
        # timestamp = str(int(time.time()))
        # payload["timestamp"] = timestamp
        # 
        # # Create signature
        # message = f"{timestamp}{json.dumps(payload, sort_keys=True)}"
        # signature = hashlib.sha256(f"{message}{self.api_key}".encode()).hexdigest()
        # payload["signature"] = signature
        
        return payload
    
    def test_connection(self) -> bool:
        """
        Test connection to GhostCut API
        
        Returns:
            bool: True if connection successful
        """
        
        try:
            response = self.session.get(
                f"{self.api_url}/health",
                timeout=10
            )
            return response.status_code == 200
        except:
            return False

# Alternative implementation for Zhaoli API (if using instead of GhostCut)
class ZhaoliClient:
    """Client for Zhaoli API (alternative to GhostCut)"""
    
    def __init__(self, app_key: str, app_secret: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.api_url = "https://api.zhaoli.com/v-w-c/gateway"
        self.session = requests.Session()
    
    def _get_signature(self, timestamp: int) -> str:
        """Generate API signature"""
        message = f"appKey={self.app_key}&appSecret={self.app_secret}&timestamp={timestamp}"
        return hashlib.md5(message.encode()).hexdigest()
    
    def submit_job(self, video_url: str, **kwargs) -> str:
        """Submit video processing job"""
        
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
        """Get job status"""
        
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
        
        # Map status
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