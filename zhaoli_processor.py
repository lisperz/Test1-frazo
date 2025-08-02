"""
Simplified Zhaoli API processor that avoids complex dependencies
Extracts only the S3 upload and Zhaoli API submission logic
"""

import boto3
import requests
import hashlib
import json
import time
import os
import logging

logging.basicConfig(level=logging.INFO)

def upload_to_s3_and_get_url(video_path, access_key_id, secret_access_key, bucket_name="taylorswiftnyu"):
    """
    Upload a video to S3 and return a public URL.
    
    Args:
        video_path: Path to the video file
        access_key_id: AWS access key ID
        secret_access_key: AWS secret access key
        bucket_name: S3 bucket name
        
    Returns:
        Public URL of the uploaded video, or None if upload failed
    """
    try:
        # Get the filename from the path
        filename = os.path.basename(video_path)
        
        # Create an S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name='us-east-2'  # Using the default region
        )
        
        # Upload the file to S3
        logging.info(f"Uploading {filename} to S3 bucket {bucket_name}...")
        s3_client.upload_file(
            video_path, 
            bucket_name, 
            filename,
            ExtraArgs={'ACL': 'public-read'}  # Make the file publicly accessible
        )
        
        # Generate a public URL for the uploaded file
        url = f"https://{bucket_name}.s3.amazonaws.com/{filename}"
        logging.info(f"Video uploaded successfully. Public URL: {url}")
        
        return url
    except Exception as e:
        logging.error(f"Error uploading video to S3: {e}")
        return None

def check_task_status(app_key, app_secret, task_id):
    """
    Check the status of a task using the Zhaoli API.
    """
    try:
        url = "https://api.zhaoli.com/v-w-c/gateway/ve/work/status"
        
        request_data = {
            "idProjects": [int(task_id)]
        }
        
        body = json.dumps(request_data)
        
        # Calculate signature
        md5_1 = hashlib.md5()
        md5_1.update(body.encode('utf-8'))
        body_md5hex = md5_1.hexdigest()
        md5_2 = hashlib.md5()
        body_md5hex = (body_md5hex + app_secret).encode('utf-8')
        md5_2.update(body_md5hex)
        sign = md5_2.hexdigest()
        
        headers = {
            'Content-type': 'application/json',
            'AppKey': app_key,
            'AppSign': sign,
        }
        
        response = requests.post(url, json=request_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 1000:
                body_data = result.get("body", {})
                content = body_data.get("content", [])
                
                if content:
                    task_data = content[0]
                    process_progress = task_data.get("processProgress", 0.0)
                    video_url = task_data.get("videoUrl", "")
                    
                    if process_progress >= 100.0:
                        status = 'COMPLETED'
                    elif process_progress > 0:
                        status = 'PROCESSING'
                    else:
                        status = 'PENDING'
                    
                    return {
                        'status': status,
                        'url': video_url,
                        'progress': process_progress,
                        'task_data': task_data
                    }
        
        return {'status': 'ERROR', 'url': None, 'error': 'Failed to get status'}
        
    except Exception as e:
        logging.error(f"Error checking task status: {e}")
        return {'status': 'ERROR', 'url': None, 'error': str(e)}

def download_video(url, output_path):
    """Download a video from a URL"""
    try:
        logging.info(f"Downloading video from {url} to {output_path}...")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Download the video with streaming
        response = requests.get(url, stream=True, timeout=300)
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            logging.info(f"Successfully downloaded video to {output_path}")
            return True
        else:
            logging.error(f"Failed to download video: HTTP {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"Error downloading video: {e}")
        return False

def process_video_simplified(input_path, output_path, access_key_id, secret_access_key, app_key, app_secret, ghostcut_uid):
    """
    Simplified video processing function using only S3 upload and Zhaoli API.
    Avoids MoviePy and OpenCV dependencies.
    """
    try:
        logging.info(f"Starting simplified video processing for: {input_path}")
        
        # Step 1: Upload video to S3
        video_url = upload_to_s3_and_get_url(
            video_path=input_path,
            access_key_id=access_key_id,
            secret_access_key=secret_access_key
        )
        
        if not video_url:
            logging.error("Failed to upload video to S3")
            return {'status': 'error', 'message': 'Failed to upload video to S3'}
        
        logging.info(f"Video uploaded to S3: {video_url}")
        
        # Step 2: Submit to Zhaoli API
        url = "https://api.zhaoli.com/v-w-c/gateway/ve/work/free"
        
        request_data = {
            "urls": [video_url],
            "uid": ghostcut_uid,
            "workName": f"Processed_{os.path.basename(input_path)}",
            "resolution": "1080p",
            "needChineseOcclude": 1,
            "videoInpaintLang": "all"
        }
        
        body = json.dumps(request_data)
        
        # Calculate signature
        md5_1 = hashlib.md5()
        md5_1.update(body.encode('utf-8'))
        body_md5hex = md5_1.hexdigest()
        md5_2 = hashlib.md5()
        body_md5hex = (body_md5hex + app_secret).encode('utf-8')
        md5_2.update(body_md5hex)
        sign = md5_2.hexdigest()
        
        headers = {
            'Content-type': 'application/json',
            'AppKey': app_key,
            'AppSign': sign,
        }
        
        logging.info(f"Submitting to Zhaoli API...")
        response = requests.post(url, json=request_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            response_json = response.json()
            
            if response_json.get("code") == 1000:
                body_data = response_json.get("body", {})
                task_id = body_data.get("idProject")
                
                if task_id:
                    logging.info(f"Successfully submitted to Zhaoli API with task ID: {task_id}")
                    
                    return {
                        'status': 'processing_started',
                        'task_id': task_id,
                        's3_url': video_url,
                        'message': 'Video processing started successfully'
                    }
                else:
                    return {'status': 'error', 'message': 'No task ID returned from Zhaoli API'}
            else:
                error_msg = response_json.get('msg', 'Unknown error')
                return {'status': 'error', 'message': f'API Error: {error_msg}'}
        else:
            return {'status': 'error', 'message': f'HTTP {response.status_code}: {response.text}'}
            
    except Exception as e:
        logging.error(f"Error in simplified video processing: {e}")
        return {'status': 'error', 'message': str(e)}