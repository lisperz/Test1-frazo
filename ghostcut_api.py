"""
Direct Ghostcut API integration for video text inpainting
Simplified version that doesn't require OpenCV or other heavy dependencies
"""

import requests
import json
import time
import os
from typing import Optional, Dict, Any

class GhostcutAPI:
    def __init__(self, app_key: str, app_secret: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.base_url = "https://api.zhaoli.com/v-w-c/gateway/ve"
        
    def upload_and_process_video(self, video_path: str) -> Dict[str, Any]:
        """Upload video to Ghostcut and start text inpainting processing"""
        
        try:
            # Step 1: Upload video file
            upload_url = f"{self.base_url}/work/free"
            
            with open(video_path, 'rb') as video_file:
                files = {
                    'file': (os.path.basename(video_path), video_file, 'video/mp4')
                }
                
                data = {
                    'app_key': self.app_key,
                    'app_secret': self.app_secret,
                    'type': 'text_inpainting',  # Specify text inpainting
                }
                
                print(f"🚀 Uploading {os.path.basename(video_path)} to Ghostcut...")
                response = requests.post(upload_url, files=files, data=data)
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Upload successful!")
                    print(f"📋 Response: {json.dumps(result, indent=2)}")
                    
                    # Extract job ID for status checking
                    job_id = result.get('data', {}).get('id') or result.get('id')
                    
                    return {
                        'status': 'upload_successful',
                        'job_id': job_id,
                        'response': result,
                        'message': 'Video uploaded to Ghostcut for text inpainting processing'
                    }
                else:
                    return {
                        'status': 'upload_failed',
                        'error': f"HTTP {response.status_code}: {response.text}",
                        'message': 'Failed to upload video to Ghostcut'
                    }
                    
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'message': 'Exception occurred during upload'
            }
    
    def check_job_status(self, job_id: str) -> Dict[str, Any]:
        """Check the processing status of a job"""
        
        try:
            status_url = f"{self.base_url}/work/status"
            
            params = {
                'app_key': self.app_key,
                'app_secret': self.app_secret,
                'id': job_id
            }
            
            response = requests.get(status_url, params=params)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'status': 'status_check_successful',
                    'job_status': result,
                    'message': 'Job status retrieved successfully'
                }
            else:
                return {
                    'status': 'status_check_failed',
                    'error': f"HTTP {response.status_code}: {response.text}",
                    'message': 'Failed to check job status'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'message': 'Exception occurred during status check'
            }

def process_video_simple(video_path: str, app_key: str, app_secret: str) -> Dict[str, Any]:
    """Simple video processing function using Ghostcut API"""
    
    api = GhostcutAPI(app_key, app_secret)
    
    print(f"🎬 Starting video text inpainting for: {os.path.basename(video_path)}")
    print(f"📁 File size: {os.path.getsize(video_path) / (1024*1024):.2f} MB")
    
    # Upload and start processing
    result = api.upload_and_process_video(video_path)
    
    if result['status'] == 'upload_successful' and result.get('job_id'):
        print(f"✅ Video submitted successfully!")
        print(f"🔍 Job ID: {result['job_id']}")
        print(f"🌐 Check your Ghostcut dashboard for processing progress")
        
        # Optionally check status immediately
        status_result = api.check_job_status(result['job_id'])
        result['initial_status'] = status_result
        
    return result

if __name__ == "__main__":
    # Test the API
    with open("zhaoli_config.json", "r") as f:
        config = json.load(f)
    
    test_video = "path/to/test/video.mp4"  # Replace with actual video path
    result = process_video_simple(test_video, config["app_key"], config["app_secret"])
    print(json.dumps(result, indent=2))