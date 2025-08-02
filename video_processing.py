import cv2
import boto3
import numpy as np
from moviepy.editor import VideoFileClip, AudioFileClip
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from concurrent.futures import ThreadPoolExecutor, as_completed
import io
import os
import gc
import logging
import requests
import hashlib
import json
import time

# New imports for automatic text detection
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR not available. Install with: pip install easyocr")

try:
    from craft_text_detector import Craft
    CRAFT_AVAILABLE = True
except ImportError:
    CRAFT_AVAILABLE = False
    logging.warning("CRAFT not available. Install with: pip install craft-text-detector")

logging.basicConfig(level=logging.INFO)

previous_detected_text_and_translation = {}

def translate_text(text, access_key_id, secret_access_key, region_name, language='es'):
    translate = boto3.client('translate', region_name=region_name,
                             aws_access_key_id=access_key_id,
                             aws_secret_access_key=secret_access_key)
    response = translate.translate_text(
        Text=text,
        SourceLanguageCode='auto',
        TargetLanguageCode=language
    )
    return response['TranslatedText']

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
    Check the status of a task using the correct Zhaoli API.
    
    Based on API documentation section "4.2 get video task result":
    - Endpoint: https://api.zhaoli.com/v-w-c/gateway/ve/work/status
    - Method: POST
    - Parameters: idProjects (List) - get results by task id
    
    Args:
        app_key: Zhaoli API key
        app_secret: Zhaoli API secret
        task_id: Task ID to check
        
    Returns:
        Dictionary with status info: {'status': 'PROCESSING'/'COMPLETED'/'FAILED', 'url': 'download_url_if_completed'}
    """
    try:
        # Use the correct endpoint from API documentation
        url = "https://api.zhaoli.com/v-w-c/gateway/ve/work/status"
        
        # Use the CORRECT parameter format from the API documentation
        # The API expects "idProjects" (List) to get results by task id
        request_data = {
            "idProjects": [int(task_id)]  # Convert to int and put in list as per API docs
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
        
        # Log the complete request details
        logging.info(f"Status Check Request URL: {url}")
        logging.info(f"Status Check Request Body: {body}")
        
        # Send request to API with timeout
        try:
            response = requests.post(url, json=request_data, headers=headers, timeout=30)
        except requests.exceptions.RequestException as e:
            logging.error(f"Request failed: {e}")
            return {'status': 'ERROR', 'url': None, 'error': f'Request failed: {str(e)}'}
        
        # Log the raw response
        logging.info(f"Status Check Response Status Code: {response.status_code}")
        logging.info(f"Status Check Response Text: {response.text}")
        
        # Check if response is successful
        if response.status_code != 200:
            return {'status': 'ERROR', 'url': None, 'error': f'HTTP {response.status_code}'}
        
        # Parse the JSON response
        try:
            response_json = response.json()
            logging.info(f"Status Check Response JSON: {response_json}")
            
            # Check if the response indicates success
            if response_json.get("code") == 1000:
                body_data = response_json.get("body", {})
                
                # The response contains a "content" array with task data
                content = body_data.get("content", [])
                
                if not content:
                    return {'status': 'NO_DATA', 'url': None, 'error': 'No task data found'}
                
                # Get the first task (should be our task)
                task_data = content[0]
                
                # Extract relevant information based on API documentation
                process_status = task_data.get("processStatus", 0)  # Processing status (Byte)
                process_progress = task_data.get("processProgress", 0.0)  # Processing progress (Double)
                video_url = task_data.get("videoUrl", "")  # Final video url after processed
                deleted = task_data.get("deleted", 0)  # Has it been deleted (0: No, 1: Yes)
                
                logging.info(f"Process Status: {process_status}")
                logging.info(f"Process Progress: {process_progress}%")
                logging.info(f"Video URL: {video_url}")
                
                # Determine status based on processStatus and progress
                if deleted == 1:
                    status = 'DELETED'
                elif process_progress >= 100.0:
                    status = 'COMPLETED'
                elif process_progress > 0:
                    status = 'PROCESSING'
                else:
                    status = 'PENDING'
                
                # Use the video URL directly - this is the processed video download URL
                download_url = video_url
                
                return {
                    'status': status,
                    'url': download_url,
                    'progress': process_progress,
                    'task_data': task_data
                }
            else:
                error_msg = response_json.get('msg', 'Unknown error')
                logging.error(f"API request failed: {error_msg}")
                return {'status': 'ERROR', 'url': None, 'error': error_msg}
                
        except ValueError as e:
            logging.error(f"Failed to parse JSON response: {e}")
            return {'status': 'ERROR', 'url': None, 'error': 'Invalid JSON response'}
            
    except Exception as e:
        logging.error(f"Error in check_task_status: {e}")
        return {'status': 'ERROR', 'url': None, 'error': str(e)}

def poll_for_results(app_key, app_secret, task_id, output_path, max_attempts=60, delay=30):
    """
    Poll the API for results of a processing task and download the video when complete.
    
    Args:
        app_key: Zhaoli API key
        app_secret: Zhaoli API secret
        task_id: Task ID to poll
        output_path: Local path where the downloaded video should be saved
        max_attempts: Maximum number of polling attempts (default: 60)
        delay: Delay between polling attempts in seconds (default: 30)
        
    Returns:
        True if video was successfully downloaded, False otherwise
    """
    logging.info(f"Starting to poll for task ID: {task_id}")
    logging.info(f"Will check every {delay} seconds for up to {max_attempts} attempts")
    
    for attempt in range(max_attempts):
        try:
            logging.info(f"Polling attempt {attempt+1}/{max_attempts}")
            
            # Check task status
            status_result = check_task_status(app_key, app_secret, task_id)
            
            if status_result['status'] == 'COMPLETED':
                download_url = status_result['url']
                if download_url:
                    logging.info(f"Task completed! Downloading video from: {download_url}")
                    
                    # Download the video
                    if download_video(download_url, output_path):
                        logging.info(f"Successfully downloaded video to: {output_path}")
                        return True
                    else:
                        logging.error("Failed to download video")
                        return False
                else:
                    logging.error("Task completed but no download URL provided")
                    return False
                    
            elif status_result['status'] == 'FAILED' or status_result['status'] == 'ERROR':
                logging.error(f"Task failed: {status_result.get('error', 'Unknown error')}")
                return False
                
            elif status_result['status'] in ['PROCESSING', 'PENDING', 'QUEUED']:
                logging.info(f"Task is still {status_result['status'].lower()}...")
                
            else:
                logging.info(f"Task status: {status_result['status']}")
            
            # Wait before next attempt (except on the last attempt)
            if attempt < max_attempts - 1:
                logging.info(f"Waiting {delay} seconds before next check...")
                time.sleep(delay)
            
        except Exception as e:
            logging.error(f"Error polling for results: {e}")
            if attempt < max_attempts - 1:
                time.sleep(delay)
    
    logging.error(f"Maximum polling attempts ({max_attempts}) reached. Task may still be processing.")
    logging.info(f"You can check the task status manually on the GhostCut website using task ID: {task_id}")
    return False

def download_video(url, output_path):
    """Download a video from a URL"""
    try:
        logging.info(f"Downloading video from {url} to {output_path}...")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Download the video with streaming
        response = requests.get(url, stream=True, timeout=300)  # 5 minute timeout
        
        if response.status_code == 200:
            # Get the total file size if available
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:  # filter out keep-alive new chunks
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Log progress for large files
                        if total_size > 0 and downloaded % (1024 * 1024) == 0:  # Every MB
                            progress = (downloaded / total_size) * 100
                            logging.info(f"Download progress: {progress:.1f}%")
            
            logging.info(f"Successfully downloaded video to {output_path} ({downloaded} bytes)")
            return True
        else:
            logging.error(f"Failed to download video: HTTP {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"Error downloading video: {e}")
        return False

def check_and_download_task(app_key, app_secret, task_id, output_path):
    """
    Check the status of a specific task and download the video if completed.
    
    Args:
        app_key: Zhaoli API key
        app_secret: Zhaoli API secret
        task_id: Task ID to check
        output_path: Local path where the downloaded video should be saved
        
    Returns:
        Dictionary with result information
    """
    try:
        logging.info(f"Checking status for task ID: {task_id}")
        
        # Check task status
        status_result = check_task_status(app_key, app_secret, task_id)
        
        if status_result['status'] == 'COMPLETED':
            download_url = status_result['url']
            if download_url:
                logging.info(f"Task completed! Downloading video from: {download_url}")
                
                # Download the video
                if download_video(download_url, output_path):
                    return {
                        'success': True,
                        'status': 'completed',
                        'message': f'Video successfully downloaded to {output_path}',
                        'output_path': output_path
                    }
                else:
                    return {
                        'success': False,
                        'status': 'download_failed',
                        'message': 'Task completed but failed to download video',
                        'download_url': download_url
                    }
            else:
                return {
                    'success': False,
                    'status': 'no_url',
                    'message': 'Task completed but no download URL provided'
                }
                
        elif status_result['status'] in ['PROCESSING', 'PENDING', 'QUEUED']:
            return {
                'success': False,
                'status': status_result['status'].lower(),
                'message': f'Task is still {status_result["status"].lower()}'
            }
            
        elif status_result['status'] in ['FAILED', 'ERROR']:
            return {
                'success': False,
                'status': 'failed',
                'message': f'Task failed: {status_result.get("error", "Unknown error")}'
            }
            
        else:
            return {
                'success': False,
                'status': 'unknown',
                'message': f'Unknown task status: {status_result["status"]}'
            }
            
    except Exception as e:
        logging.error(f"Error checking and downloading task: {e}")
        return {
            'success': False,
            'status': 'error',
            'message': f'Error: {str(e)}'
        }

def append_to_video(image_or_frame, video_writer):
    try:
        if isinstance(image_or_frame, bytes):
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_or_frame, np.uint8)
            # Decode the numpy array into an image
            image_or_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image_or_frame is None:
                logging.error("Failed to decode image bytes")
                return False
        elif not isinstance(image_or_frame, np.ndarray):
            # Ensure the frame is in the correct format (numpy array)
            logging.error("Invalid frame type")
            return False

        # Write the frame to the video
        video_writer.write(image_or_frame)
        return True
    except Exception as e:
        logging.error(f"Error in append_to_video: {e}")
        return False

def save_frame_to_s3(image, bucket_name, s3_key, access_key_id, secret_access_key, region_name):
    s3_client = boto3.client('s3', region_name=region_name,
                             aws_access_key_id=access_key_id,
                             aws_secret_access_key=secret_access_key)
    buffer = io.BytesIO()
    image.save(buffer, 'PNG')
    buffer.seek(0)
    s3_client.put_object(Bucket=bucket_name, Key=s3_key, Body=buffer, ContentType='image/png')
    s3_url = f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{s3_key}"
    return s3_url

def get_detected_font(image_url):
    api_url = "https://www.whatfontis.com/api2/"

    payload = {
        "API_KEY": "f3f44bcb40aa0b425b8e9caf556848f0f8ef49ba42a4156d661cc123e9ef15d7",
        "IMAGEBASE64": 0,
        "urlimage": image_url,  # If you're not using a URL for the image, leave this empty
        "limit": 1  # Adjust the limit as needed
    }
    response = requests.post(api_url, json=payload)
    if response.status_code == 200:
        fonts = response.json()
        if fonts and isinstance(fonts, list) and len(fonts) > 0:
            return fonts[0].get("title", "Arial")
        else:
            return "Arial.ttf"
    else:
        logging.error(f"Failed to get font from WhatFontIs API: {response.status_code}")
        return "Arial.ttf"

def overwrite_text_in_image(image, rekognition, access_key_id, secret_access_key, region_name, selected_font, cap, output_video):
    try:
        # Convert the image to a PIL image
        image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        # Create a copy of the image
        modified_image_pil = image_pil.copy()

        # Convert the image to bytes
        image_bytes_io = io.BytesIO()
        modified_image_pil.save(image_bytes_io, format='PNG')
        image_bytes = image_bytes_io.getvalue()

        # Detect text in the image
        response = rekognition.detect_text(Image={'Bytes': image_bytes})

        # Create a draw object for the image
        draw = ImageDraw.Draw(modified_image_pil)
        font_name = f"fonts/{selected_font}.ttf"  # Use selected font
        
######################################
        # Create a mask for all text regions
        mask = np.zeros(image.shape[:2], dtype=np.uint8)

        
##############################################
        for text_detection in response['TextDetections']:
            # Check if the text detection is a line and has a high confidence
            if text_detection['Type'] == 'LINE' and text_detection["Confidence"] > 98:
                logging.info(f"Detected text: {text_detection['DetectedText']}")
                bbox = text_detection['Geometry']['BoundingBox']
                left = int(bbox['Left'] * modified_image_pil.width)
                top = int(bbox['Top'] * modified_image_pil.height)
                width = bbox['Width'] * modified_image_pil.width
                height = bbox['Height'] * modified_image_pil.height
                draw.rectangle([left, top, left + width, top + height])

                #####################################################################################
                # Define the output video writer
                print('masking')  

                #create blank mask moved out of the text loop
                
                # Iterate through detected text regions and add to the mask
                
                # Expand the bounding box slightly for better inpainting
                padding = 5
                x, y, w, h = left-padding, top-padding, width+2*padding, height+2*padding
                x, y = max(0, x), max(0, y) # Ensure the coordinates are within the image boundaries
                
                cv2.rectangle(mask, (int(x), int(y)), (int(x+w), int(y+h)), (255), -1)
                

                #####################################################################################


                font_size = 30.0
                font = ImageFont.truetype(font_name, size=int(font_size))

                text_area = modified_image_pil.crop((left, top, left + width, top + height))
                blurred_text_area = text_area.filter(ImageFilter.GaussianBlur(radius=10))
                modified_image_pil.paste(blurred_text_area, (left, top))

                translated_text = previous_detected_text_and_translation.get(text_detection["DetectedText"], None)
                if translated_text is None:
                    translated_text = translate_text(text_detection["DetectedText"], access_key_id, secret_access_key, region_name)
                    previous_detected_text_and_translation[text_detection["DetectedText"]] = translated_text

                draw.text((left, top), translated_text, fill='white', font=font)
                

        ####################re-write image
                # Inpaint the text regions using a more subtle method
        inpaint_image = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
        # Write the inpainted frame to the output video
        output_video.write(inpaint_image)
      
        ####################send to s3    


        return modified_image_pil, output_video
    except Exception as e:
        logging.error(f"Error in overwrite_text_in_image: {e}")
        return None

def process_frame(frame, rekognition, access_key_id, secret_access_key, region_name, selected_font, cap, output_video):
    if frame is not None:
        result = overwrite_text_in_image(frame, rekognition, access_key_id, secret_access_key, region_name, selected_font, cap, output_video)
        if result is not None:
            modified_image, output_video = result
        else:
            modified_image = None
            output_video = None
        
        if result is not None:
            modified_frame_data = cv2.cvtColor(np.array(modified_image), cv2.COLOR_RGB2BGR)
            return modified_frame_data

    return None

def extract_frames(video_path, access_key_id, secret_access_key, region_name, bucket_name, selected_font, output_video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        logging.error("Error opening video file.")
        return

    frame_count = 0
    extracted_count = 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    
    video_writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height), isColor=True)

    audio_output_path = "extracted_audio.wav"
    video_clip = VideoFileClip(video_path)
    audio_clip = video_clip.audio
    audio_clip.write_audiofile(audio_output_path)

    video_clip.close()
    audio_clip.close()

    num_cores = os.cpu_count()

    rekognition = boto3.client('rekognition', region_name=region_name,
                               aws_access_key_id=access_key_id,
                               aws_secret_access_key=secret_access_key)

    with ThreadPoolExecutor(max_workers=min(num_cores, 1)) as executor:
        futures = []
        video = cap
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        fps = video.get(cv2.CAP_PROP_FPS)
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        #change this to the s3
        output_video = cv2.VideoWriter(r"test_video_mask.mp4", fourcc, fps, (width, height))
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            futures.append(executor.submit(process_frame, frame, rekognition, access_key_id, secret_access_key, region_name, selected_font, cap, output_video))
            frame_count += 1
            del frame

        for future in as_completed(futures):
            modified_frame_data = future.result()
            if modified_frame_data is not None:
                append_to_video(modified_frame_data, video_writer)
                extracted_count += 1

    logging.info(f"Frame count: {frame_count}")
    if video_writer is not None:
        video_writer.release()
    ###############################################################
    if output_video is not None:
        output_video.release()
        print('Video writer released')
    print('released')
    s3 = boto3.client('s3')
    S3_BUCKET = 'elasticbeanstalk-us-east-2-039300220315'
    

    s3.upload_file("test_video_mask.mp4", S3_BUCKET, "test_video_mask.mp4")
    #####################################################################
    cap.release()
    merge_video_audio(output_video_path, audio_output_path, 'merged_video.mp4')

    logging.info(f"Extraction completed. {extracted_count} frames were processed.")

def delete_s3_object(bucket_name, s3_key, access_key_id, secret_access_key, region_name):
    s3_client = boto3.client('s3', region_name=region_name,
                             aws_access_key_id=access_key_id,
                             aws_secret_access_key=secret_access_key)
    s3_client.delete_object(Bucket=bucket_name, Key=s3_key)

def merge_video_audio(video_file, audio_file, output_file):
    video_clip = VideoFileClip(video_file)
    logging.info(f"Video Duration: {video_clip.duration} seconds")
    logging.info(f"Video Resolution: {video_clip.size}")
    logging.info(f"Video Frame Rate: {video_clip.fps} fps")
    logging.info(f"Video Aspect Ratio: {video_clip.aspect_ratio}")
    audio_clip = AudioFileClip(audio_file)
    video_clip = video_clip.set_audio(audio_clip)
    video_clip.write_videofile(output_file, codec="libx264", audio_codec="aac")
    video_clip.close()
    audio_clip.close()

def detect_text_regions_with_craft(image, output_dir='temp_craft'):
    """
    Detect text regions using CRAFT text detector.
    
    Args:
        image: Input image as numpy array
        output_dir: Temporary directory for CRAFT outputs
        
    Returns:
        List of normalized bounding boxes [(x1, y1, x2, y2), ...]
    """
    if not CRAFT_AVAILABLE:
        return []
    
    try:
        # Create temporary directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Create CRAFT instance
        craft = Craft(output_dir=output_dir, crop_type="box", cuda=False)
        
        # Convert numpy array to PIL Image
        if isinstance(image, np.ndarray):
            image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        else:
            image_pil = image
            
        # Detect text
        prediction_result = craft.detect_text(image_pil)
        
        # Clean up models
        craft.unload_craftnet_model()
        craft.unload_refinenet_model()
        
        # Extract bounding boxes and normalize
        boxes = []
        if 'boxes' in prediction_result:
            height, width = image.shape[:2] if isinstance(image, np.ndarray) else (image_pil.height, image_pil.width)
            
            for box in prediction_result['boxes']:
                # box is typically [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                if len(box) >= 4:
                    x_coords = [point[0] for point in box]
                    y_coords = [point[1] for point in box]
                    
                    x1, x2 = min(x_coords), max(x_coords)
                    y1, y2 = min(y_coords), max(y_coords)
                    
                    # Normalize coordinates
                    x1_norm = x1 / width
                    y1_norm = y1 / height
                    x2_norm = x2 / width
                    y2_norm = y2 / height
                    
                    boxes.append([x1_norm, y1_norm, x2_norm, y2_norm])
        
        # Clean up temporary directory
        import shutil
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
            
        return boxes
        
    except Exception as e:
        logging.error(f"Error in CRAFT text detection: {e}")
        return []

def detect_text_regions_with_easyocr(image, languages=['en']):
    """
    Detect text regions using EasyOCR.
    
    Args:
        image: Input image as numpy array
        languages: List of languages to detect
        
    Returns:
        List of normalized bounding boxes [(x1, y1, x2, y2), ...]
    """
    if not EASYOCR_AVAILABLE:
        return []
    
    try:
        # Initialize EasyOCR reader
        reader = easyocr.Reader(languages, gpu=False)
        
        # Detect text
        results = reader.readtext(image)
        
        # Extract bounding boxes and normalize
        boxes = []
        height, width = image.shape[:2]
        
        for result in results:
            # result format: (bbox, text, confidence)
            bbox = result[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            confidence = result[2]
            
            # Filter by confidence
            if confidence > 0.5:
                x_coords = [point[0] for point in bbox]
                y_coords = [point[1] for point in bbox]
                
                x1, x2 = min(x_coords), max(x_coords)
                y1, y2 = min(y_coords), max(y_coords)
                
                # Normalize coordinates
                x1_norm = x1 / width
                y1_norm = y1 / height
                x2_norm = x2 / width
                y2_norm = y2 / height
                
                boxes.append([x1_norm, y1_norm, x2_norm, y2_norm])
        
        return boxes
        
    except Exception as e:
        logging.error(f"Error in EasyOCR text detection: {e}")
        return []

def detect_text_regions_with_opencv(image):
    """
    Detect text regions using OpenCV with precise filtering for actual text only.
    This version focuses on high-contrast text areas and avoids clothing/fabric patterns.
    
    Args:
        image: Input image as numpy array
        
    Returns:
        List of normalized bounding boxes [(x1, y1, x2, y2), ...]
    """
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        height, width = image.shape[:2]
        
        # Apply multiple text detection approaches and combine results
        boxes = []
        
        # Method 1: High contrast text detection (for subtitles/overlays)
        # Use binary threshold to find high contrast text
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Create kernel for text-like morphology
        # Horizontal kernel to connect characters in words
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, horizontal_kernel)
        
        # Find contours for high contrast text
        contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            x, y, w, h = cv2.boundingRect(contour)
            
            # Very strict criteria for text detection
            aspect_ratio = w / h
            
            # Text characteristics:
            # - Rectangular shape with high aspect ratio
            # - Reasonable size for readability
            # - Located in typical text areas
            if (area > 300 and  # Minimum area for visible text (lowered)
                area < (width * height * 0.15) and  # Max 15% of screen (increased for overlays)
                2.5 < aspect_ratio < 25 and  # Text is much wider than tall (expanded range)
                w > 40 and  # Minimum width for readable text (lowered)
                h > 12 and  # Minimum height for readable text (lowered)
                h < height * 0.12):  # Max 12% of screen height (increased)
                
                # Location filtering - only typical text areas
                y_center = y + h/2
                y_ratio = y_center / height
                x_center = x + w/2
                x_ratio = x_center / width
                
                # Expanded text detection areas to include overlays
                is_subtitle = (y_ratio > 0.75 and  # Bottom 25% for subtitles
                             x_ratio > 0.1 and x_ratio < 0.9)  # Not too close to edges
                
                is_corner_logo = (y_ratio < 0.15 and  # Top 15% for logos
                                (x_ratio < 0.2 or x_ratio > 0.8))  # Left or right corners
                
                # Add detection for text overlays (like "Utilitarianism")
                is_text_overlay = (y_ratio > 0.15 and y_ratio < 0.85 and  # Middle areas
                                 x_ratio > 0.3 and x_ratio < 0.95 and  # Right side focus
                                 aspect_ratio > 5 and  # Very wide text
                                 w > width * 0.15)  # Substantial width for overlay text
                
                if is_subtitle or is_corner_logo or is_text_overlay:
                    # Additional validation: check for text-like edge density
                    roi = gray[y:y+h, x:x+w]
                    edges = cv2.Canny(roi, 50, 150)
                    edge_density = np.sum(edges > 0) / (w * h)
                    
                    # Text should have moderate edge density (relaxed for overlays)
                    edge_threshold_min = 0.03 if is_text_overlay else 0.05
                    edge_threshold_max = 0.4 if is_text_overlay else 0.3
                    
                    if edge_threshold_min < edge_density < edge_threshold_max:
                        x1_norm = x / width
                        y1_norm = y / height
                        x2_norm = (x + w) / width
                        y2_norm = (y + h) / height
                        boxes.append([x1_norm, y1_norm, x2_norm, y2_norm])
        
        # Method 2: Inverted binary for white text on dark background
        binary_inv = cv2.bitwise_not(binary)
        horizontal_lines_inv = cv2.morphologyEx(binary_inv, cv2.MORPH_CLOSE, horizontal_kernel)
        contours_inv, _ = cv2.findContours(horizontal_lines_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours_inv:
            area = cv2.contourArea(contour)
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h
            
            if (area > 300 and
                area < (width * height * 0.15) and
                2.5 < aspect_ratio < 25 and
                w > 40 and h > 12 and h < height * 0.12):
                
                y_center = y + h/2
                y_ratio = y_center / height
                x_center = x + w/2
                x_ratio = x_center / width
                
                is_subtitle = (y_ratio > 0.75 and x_ratio > 0.1 and x_ratio < 0.9)
                is_corner_logo = (y_ratio < 0.15 and (x_ratio < 0.2 or x_ratio > 0.8))
                is_text_overlay = (y_ratio > 0.15 and y_ratio < 0.85 and
                                 x_ratio > 0.3 and x_ratio < 0.95 and
                                 aspect_ratio > 5 and w > width * 0.15)
                
                if is_subtitle or is_corner_logo or is_text_overlay:
                    roi = gray[y:y+h, x:x+w]
                    edges = cv2.Canny(roi, 50, 150)
                    edge_density = np.sum(edges > 0) / (w * h)
                    
                    if 0.05 < edge_density < 0.3:
                        x1_norm = x / width
                        y1_norm = y / height
                        x2_norm = (x + w) / width
                        y2_norm = (y + h) / height
                        
                        # Check if this box is already detected
                        is_duplicate = False
                        for existing_box in boxes:
                            if calculate_box_overlap([x1_norm, y1_norm, x2_norm, y2_norm], existing_box) > 0.5:
                                is_duplicate = True
                                break
                        
                        if not is_duplicate:
                            boxes.append([x1_norm, y1_norm, x2_norm, y2_norm])
        
        # Final filtering: remove overlapping boxes and keep the best ones
        filtered_boxes = []
        for box in boxes:
            is_duplicate = False
            for existing_box in filtered_boxes:
                if calculate_box_overlap(box, existing_box) > 0.6:
                    is_duplicate = True
                    break
            if not is_duplicate:
                filtered_boxes.append(box)
        
        return filtered_boxes
        
    except Exception as e:
        logging.error(f"Error in OpenCV text detection: {e}")
        return []

def calculate_box_overlap(box1, box2):
    """
    Calculate the overlap ratio between two bounding boxes.
    
    Args:
        box1, box2: Bounding boxes in format [x1, y1, x2, y2]
        
    Returns:
        Overlap ratio (0-1)
    """
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    
    # Calculate intersection
    x_overlap = max(0, min(x2_1, x2_2) - max(x1_1, x1_2))
    y_overlap = max(0, min(y2_1, y2_2) - max(y1_1, y1_2))
    
    if x_overlap == 0 or y_overlap == 0:
        return 0
    
    intersection = x_overlap * y_overlap
    
    # Calculate union
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    union = area1 + area2 - intersection
    
    return intersection / union if union > 0 else 0

def sample_frames_for_text_detection(video_path, num_samples=10):
    """
    Sample frames from video for text detection analysis.
    
    Args:
        video_path: Path to video file
        num_samples: Number of frames to sample
        
    Returns:
        List of sampled frames as numpy arrays
    """
    try:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logging.error("Error opening video file for sampling")
            return []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame indices to sample
        if total_frames <= num_samples:
            frame_indices = list(range(total_frames))
        else:
            step = total_frames // num_samples
            frame_indices = [i * step for i in range(num_samples)]
        
        frames = []
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                frames.append(frame)
        
        cap.release()
        return frames
        
    except Exception as e:
        logging.error(f"Error sampling frames: {e}")
        return []

def analyze_video_text_regions(video_path, detection_methods=['easyocr', 'craft', 'opencv']):
    """
    Analyze video to detect consistent text regions and create expanded coverage areas.
    
    This optimized approach:
    1. Samples frames to identify general text areas
    2. Groups text regions by location (e.g., bottom subtitles, top overlays)
    3. Creates expanded bounding boxes that cover all text variations in each area
    4. Generates fewer, larger masks that work for the entire video
    
    Args:
        video_path: Path to video file
        detection_methods: List of detection methods to use
        
    Returns:
        List of video inpaint masks for the Zhaoli API
    """
    try:
        logging.info(f"Analyzing video for consistent text regions: {video_path}")
        
        # Sample fewer frames since we're looking for consistent areas
        frames = sample_frames_for_text_detection(video_path, num_samples=8)
        
        if not frames:
            logging.warning("No frames could be sampled from video")
            return create_fallback_text_regions(video_path)
        
        # Collect all detected text regions from all frames
        all_boxes = []
        
        for i, frame in enumerate(frames):
            frame_boxes = []
            
            # Try different detection methods
            if 'easyocr' in detection_methods and EASYOCR_AVAILABLE:
                boxes = detect_text_regions_with_easyocr(frame)
                frame_boxes.extend(boxes)
                logging.info(f"Frame {i}: EasyOCR detected {len(boxes)} text regions")
            
            if 'craft' in detection_methods and CRAFT_AVAILABLE:
                boxes = detect_text_regions_with_craft(frame)
                frame_boxes.extend(boxes)
                logging.info(f"Frame {i}: CRAFT detected {len(boxes)} text regions")
            
            if 'opencv' in detection_methods:
                boxes = detect_text_regions_with_opencv(frame)
                frame_boxes.extend(boxes)
                logging.info(f"Frame {i}: OpenCV detected {len(boxes)} text regions")
            
            all_boxes.extend(frame_boxes)
        
        if not all_boxes:
            logging.warning("No text regions detected in video, using fallback regions")
            return create_fallback_text_regions(video_path)
        
        # Check if we detected the main subtitle area (center-bottom)
        has_subtitle = False
        for box in all_boxes:
            x1, y1, x2, y2 = box
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            # Check if this box is in the center-bottom area where subtitles should be
            if 0.2 < center_x < 0.8 and center_y > 0.6:
                has_subtitle = True
                break
        
        if not has_subtitle:
            logging.warning("Main subtitle area not detected, using fallback regions")
            return create_fallback_text_regions(video_path)
        
        # Group text regions by consistent areas and create expanded coverage zones
        coverage_zones = create_expanded_coverage_zones(all_boxes)
        
        # Get video duration
        video_clip = VideoFileClip(video_path)
        duration = video_clip.duration
        video_clip.close()
        
        # Create a single unified bounding box that covers all coverage zones
        if coverage_zones:
            # Find the bounding box that encompasses all zones
            min_x = min(zone[0] for zone in coverage_zones)  # leftmost x
            min_y = min(zone[1] for zone in coverage_zones)  # topmost y
            max_x = max(zone[2] for zone in coverage_zones)  # rightmost x
            max_y = max(zone[3] for zone in coverage_zones)  # bottommost y
            
            # Calculate the unified area
            unified_width = max_x - min_x
            unified_height = max_y - min_y
            unified_area = unified_width * unified_height
            
            # Create single mask covering all text regions
            video_inpaint_masks = [{
                "type": "remove_only_ocr",
                "start": 0,
                "end": duration,
                "region": [
                    [min_x, min_y],  # Top left
                    [max_x, min_y],  # Top right
                    [max_x, max_y],  # Bottom right
                    [min_x, max_y]   # Bottom left
                ]
            }]
            
            logging.info(f"Created unified coverage zone: ({min_x:.3f}, {min_y:.3f}) to ({max_x:.3f}, {max_y:.3f})")
            logging.info(f"Unified zone area: {unified_area:.1%} of screen")
            logging.info(f"Covers {len(coverage_zones)} individual text regions")
        else:
            video_inpaint_masks = []
            logging.warning("No coverage zones found")
        
        logging.info(f"Created {len(video_inpaint_masks)} unified coverage zone for entire video")
        return video_inpaint_masks
        
    except Exception as e:
        logging.error(f"Error analyzing video text regions: {e}")
        return create_fallback_text_regions(video_path)

def create_expanded_coverage_zones(all_boxes, min_zone_height=0.03, expansion_factor=0.02):
    """
    Create small, precise coverage zones from detected text regions.
    Each zone should be < 20% of screen area and target only actual text.
    
    Args:
        all_boxes: List of all detected text bounding boxes from multiple frames
        min_zone_height: Minimum height for a coverage zone (default: 3% of screen)
        expansion_factor: How much to expand each zone (default: 2% padding)
        
    Returns:
        List of small, precise coverage zones [(x1, y1, x2, y2), ...]
    """
    if not all_boxes:
        return []
    
    logging.info(f"Creating small, precise coverage zones from {len(all_boxes)} detected text regions")
    
    # Instead of grouping, create individual zones for each unique text area
    # This prevents creating huge zones that cover the entire screen
    coverage_zones = []
    
    # Remove duplicate/overlapping boxes first
    unique_boxes = []
    for box in all_boxes:
        is_duplicate = False
        for existing_box in unique_boxes:
            if calculate_box_overlap(box, existing_box) > 0.5:  # 50% overlap threshold
                is_duplicate = True
                break
        if not is_duplicate:
            unique_boxes.append(box)
    
    logging.info(f"Reduced {len(all_boxes)} detections to {len(unique_boxes)} unique text areas")
    
    # Create small, precise zones for each unique text area
    for i, box in enumerate(unique_boxes):
        x1, y1, x2, y2 = box
        
        # Calculate current zone size
        current_width = x2 - x1
        current_height = y2 - y1
        current_area = current_width * current_height
        
        # Add small expansion for coverage
        expanded_x1 = max(0, x1 - expansion_factor)
        expanded_x2 = min(1, x2 + expansion_factor)
        expanded_y1 = max(0, y1 - expansion_factor)
        expanded_y2 = min(1, y2 + expansion_factor)
        
        # Ensure minimum height for visibility
        zone_height = expanded_y2 - expanded_y1
        if zone_height < min_zone_height:
            center_y = (expanded_y1 + expanded_y2) / 2
            half_min_height = min_zone_height / 2
            expanded_y1 = max(0, center_y - half_min_height)
            expanded_y2 = min(1, center_y + half_min_height)
        
        # Calculate final zone area
        final_width = expanded_x2 - expanded_x1
        final_height = expanded_y2 - expanded_y1
        final_area = final_width * final_height
        
        # Ensure zone is < 20% of screen area
        max_area = 0.20  # 20% of screen
        if final_area > max_area:
            # Scale down the zone to fit within 20% area constraint
            scale_factor = (max_area / final_area) ** 0.5
            
            # Recalculate with scaling
            center_x = (expanded_x1 + expanded_x2) / 2
            center_y = (expanded_y1 + expanded_y2) / 2
            
            scaled_width = final_width * scale_factor
            scaled_height = final_height * scale_factor
            
            expanded_x1 = max(0, center_x - scaled_width / 2)
            expanded_x2 = min(1, center_x + scaled_width / 2)
            expanded_y1 = max(0, center_y - scaled_height / 2)
            expanded_y2 = min(1, center_y + scaled_height / 2)
            
            final_area = scaled_width * scaled_height
        
        coverage_zone = [expanded_x1, expanded_y1, expanded_x2, expanded_y2]
        coverage_zones.append(coverage_zone)
        
        logging.info(f"Created precise zone {i+1}: ({expanded_x1:.3f}, {expanded_y1:.3f}) to ({expanded_x2:.3f}, {expanded_y2:.3f}) - Area: {final_area:.1%}")
    
    # Final check: merge only zones that are very close to each other
    # This prevents having too many tiny zones while keeping them small
    final_zones = merge_overlapping_zones(coverage_zones, overlap_threshold=0.6)
    
    # Ensure all final zones are < 20% area
    validated_zones = []
    for zone in final_zones:
        x1, y1, x2, y2 = zone
        area = (x2 - x1) * (y2 - y1)
        if area <= 0.20:  # 20% max area
            validated_zones.append(zone)
            logging.info(f"Validated zone: Area {area:.1%} (< 20% limit)")
        else:
            logging.warning(f"Rejected zone: Area {area:.1%} (> 20% limit)")
    
    logging.info(f"Final validated zones: {len(validated_zones)} (all < 20% screen area)")
    return validated_zones

def group_boxes_by_vertical_position(boxes, position_threshold=0.15):
    """
    Group text boxes by their vertical position to identify consistent text areas.
    
    Args:
        boxes: List of bounding boxes [(x1, y1, x2, y2), ...]
        position_threshold: Threshold for grouping boxes by position
        
    Returns:
        Dictionary of grouped boxes by position
    """
    groups = {
        'top_subtitle': [],      # Top 25% of screen
        'middle_overlay': [],    # Middle 50% of screen  
        'bottom_subtitle': [],   # Bottom 25% of screen
        'other': []
    }
    
    for box in boxes:
        x1, y1, x2, y2 = box
        center_y = (y1 + y2) / 2
        
        if center_y <= 0.25:
            groups['top_subtitle'].append(box)
        elif center_y >= 0.75:
            groups['bottom_subtitle'].append(box)
        elif 0.25 < center_y < 0.75:
            groups['middle_overlay'].append(box)
        else:
            groups['other'].append(box)
    
    # Remove empty groups
    return {k: v for k, v in groups.items() if v}

def merge_overlapping_zones(zones, overlap_threshold=0.3):
    """
    Merge overlapping coverage zones to avoid redundancy.
    
    Args:
        zones: List of coverage zones [(x1, y1, x2, y2), ...]
        overlap_threshold: Minimum overlap to trigger merge
        
    Returns:
        List of merged zones
    """
    if len(zones) <= 1:
        return zones
    
    merged = []
    used = set()
    
    for i, zone1 in enumerate(zones):
        if i in used:
            continue
            
        current_zone = zone1
        
        for j, zone2 in enumerate(zones[i+1:], i+1):
            if j in used:
                continue
                
            # Check if zones overlap significantly
            if zones_overlap(current_zone, zone2, overlap_threshold):
                # Merge the zones
                x1 = min(current_zone[0], zone2[0])
                y1 = min(current_zone[1], zone2[1])
                x2 = max(current_zone[2], zone2[2])
                y2 = max(current_zone[3], zone2[3])
                current_zone = [x1, y1, x2, y2]
                used.add(j)
        
        merged.append(current_zone)
        used.add(i)
    
    return merged

def zones_overlap(zone1, zone2, threshold=0.3):
    """
    Check if two zones overlap significantly.
    
    Args:
        zone1, zone2: Coverage zones [(x1, y1, x2, y2)]
        threshold: Minimum overlap ratio
        
    Returns:
        Boolean indicating if zones overlap significantly
    """
    x1_1, y1_1, x2_1, y2_1 = zone1
    x1_2, y1_2, x2_2, y2_2 = zone2
    
    # Calculate intersection
    x_overlap = max(0, min(x2_1, x2_2) - max(x1_1, x1_2))
    y_overlap = max(0, min(y2_1, y2_2) - max(y1_1, y1_2))
    
    if x_overlap == 0 or y_overlap == 0:
        return False
    
    intersection_area = x_overlap * y_overlap
    
    # Calculate areas
    area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
    area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
    
    # Calculate overlap ratio
    overlap_ratio = intersection_area / min(area1, area2)
    
    return overlap_ratio >= threshold

def create_fallback_text_regions(video_path):
    """
    Create precise fallback text regions when automatic detection fails.
    Uses targeted subtitle and logo positions based on common video layouts.
    
    Args:
        video_path: Path to video file
        
    Returns:
        List of video inpaint masks for precise subtitle and logo areas
    """
    try:
        # Get video duration
        video_clip = VideoFileClip(video_path)
        duration = video_clip.duration
        video_clip.close()
        
        # Create a single unified mask that covers both subtitle and logo areas
        video_inpaint_masks = [
            {
                "type": "remove_only_ocr",
                "start": 0,
                "end": duration,
                "region": [
                    [0.15, 0.0],    # Top left (covers both logo and subtitle areas)
                    [1.0, 0.0],     # Top right (full width for logo area)
                    [1.0, 0.95],    # Bottom right (covers subtitle area)
                    [0.15, 0.95]    # Bottom left (unified coverage)
                ]
            }
        ]
        
        logging.info(f"Created {len(video_inpaint_masks)} precise fallback text removal masks")
        return video_inpaint_masks
        
    except Exception as e:
        logging.error(f"Error creating fallback text regions: {e}")
        return []

def merge_overlapping_regions(boxes, overlap_threshold=0.3):
    """
    Merge overlapping bounding boxes to create consolidated regions.
    
    Args:
        boxes: List of bounding boxes [(x1, y1, x2, y2), ...]
        overlap_threshold: Minimum overlap ratio to merge boxes
        
    Returns:
        List of merged bounding boxes
    """
    if not boxes:
        return []
    
    # Remove duplicates and sort
    unique_boxes = list(set(tuple(box) for box in boxes))
    unique_boxes = [list(box) for box in unique_boxes]
    
    # Group boxes by vertical position (to handle subtitle regions)
    vertical_groups = []
    for box in unique_boxes:
        x1, y1, x2, y2 = box
        center_y = (y1 + y2) / 2
        
        # Find existing group or create new one
        assigned = False
        for group in vertical_groups:
            group_center_y = sum((b[1] + b[3]) / 2 for b in group) / len(group)
            if abs(center_y - group_center_y) < 0.1:  # Within 10% height
                group.append(box)
                assigned = True
                break
        
        if not assigned:
            vertical_groups.append([box])
    
    # Merge boxes within each group
    merged_boxes = []
    for group in vertical_groups:
        if len(group) == 1:
            merged_boxes.append(group[0])
        else:
            # Calculate bounding box of all boxes in group
            x1_min = min(box[0] for box in group)
            y1_min = min(box[1] for box in group)
            x2_max = max(box[2] for box in group)
            y2_max = max(box[3] for box in group)
            
            merged_boxes.append([x1_min, y1_min, x2_max, y2_max])
    
    return merged_boxes

def process_video(input_path, output_path, access_key_id, secret_access_key, region_name, selected_font, use_zhaoli_api=False, app_key=None, app_secret=None, ghostcut_uid=None):
    """
    Process a video to detect and translate text.
    
    Args:
        input_path: Path to the input video
        output_path: Path to save the processed video
        access_key_id: AWS access key ID
        secret_access_key: AWS secret access key
        region_name: AWS region name
        selected_font: Font to use for translated text
        use_zhaoli_api: Whether to use the Zhaoli API instead of the AWS-based method
        app_key: Zhaoli API key (required if use_zhaoli_api is True)
        app_secret: Zhaoli API secret (required if use_zhaoli_api is True)
        ghostcut_uid: GhostCut UID (required if use_zhaoli_api is True)
        
    Returns:
        For Zhaoli API: A dictionary containing the task ID
        For AWS processing: None
    """
    if use_zhaoli_api:
        if not app_key or not app_secret:
            logging.error("Zhaoli API key and secret are required when use_zhaoli_api is True")
            return None
            
        if not ghostcut_uid or ghostcut_uid == "YOUR_GHOSTCUT_UID":
            logging.error("GhostCut UID is required when use_zhaoli_api is True")
            return None
        
        # Create a task using the Zhaoli API
        try:
            # Upload the video to S3 to get a public URL
            video_url = upload_to_s3_and_get_url(video_path=input_path, access_key_id=access_key_id, secret_access_key=secret_access_key)
            if not video_url:
                logging.error("Failed to upload video to get a public URL")
                return None
            
            # Get video duration for logging purposes
            video_clip = VideoFileClip(input_path)
            duration = video_clip.duration
            video_clip.close()
            
            logging.info(f"Video duration: {duration:.2f} seconds")
            # No need to create masks - using automatic text detection
            
            # Use the correct Zhaoli API endpoint for text removal and inpainting
            url = "https://api.zhaoli.com/v-w-c/gateway/ve/work/free"
            
            logging.info(f"Using API endpoint: {url}")
            
            # Prepare the request body with CORRECT parameters based on API documentation
            request_data = {
                # Basic parameters (required)
                "urls": [video_url],  # Array of video URLs that need to be processed
                "uid": ghostcut_uid,  # GhostCut UID (required)
                
                # Optional parameters
                "workName": f"Processed_{os.path.basename(input_path)}",  # Name of the final work
                "resolution": "1080p",  # Default resolution (480p, 720p, 1080p)
                
                # Automatic text detection parameters
                "needChineseOcclude": 1,  # 1: Full-screen erase with automatic text detection
                "videoInpaintLang": "all"  # Remove all languages
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
            
            # Log the complete request details
            logging.info(f"Request URL: {url}")
            logging.info(f"Request Headers: {headers}")
            logging.info(f"Request Body: {body}")
            
            # Send request to API
            response = requests.post(url, json=request_data, headers=headers, timeout=30)
            
            # Log the raw response
            logging.info(f"Response Status Code: {response.status_code}")
            logging.info(f"Response Headers: {response.headers}")
            logging.info(f"Response Text: {response.text}")
            
            # Parse the JSON response
            response_json = response.json()
            logging.info(f"Response JSON: {response_json}")
            
            # Check if the request was successful
            if response_json.get("code") == 1000:
                # Parse the response based on API documentation
                body_data = response_json.get("body", {})
                logging.info(f"Response body: {body_data}")
                
                # Extract task ID from the response
                # Based on API docs, the response contains idProject (Task ID) and dataList
                extracted_task_id = body_data.get("idProject")
                
                if not extracted_task_id:
                    # Fallback: try to extract from dataList if idProject is not available
                    data_list = body_data.get("dataList", [])
                    if data_list and len(data_list) > 0:
                        # Extract ID from the first item in dataList
                        first_item = data_list[0]
                        extracted_task_id = first_item.get("id")
                        logging.info(f"Extracted task ID from dataList: {extracted_task_id}")
                
                if not extracted_task_id:
                    logging.error("Could not extract task ID from response")
                    return None
                
                logging.info(f"Successfully created task with ID: {extracted_task_id}")
                
                # Poll for results and download the video when complete
                logging.info(f"Task created successfully with ID: {extracted_task_id}")
                logging.info(f"Starting to poll for results...")
                
                # Poll for results and download the video
                success = poll_for_results(app_key, app_secret, extracted_task_id, output_path)
                
                if success:
                    logging.info(f"Video processing completed successfully! Output saved to: {output_path}")
                    return {'task_id': extracted_task_id, 'status': 'completed', 'output_path': output_path}
                else:
                    logging.warning(f"Failed to automatically download the video. Task ID: {extracted_task_id}")
                    # Create a placeholder file to inform the user
                    info_file_path = output_path.replace('.mp4', '_task_info.txt')
                    with open(info_file_path, 'w') as f:
                        f.write(f"Task ID: {extracted_task_id}\n")
                        f.write(f"Status: Processing may still be in progress\n")
                        f.write(f"Please check the status of your task on the GhostCut website.\n")
                        f.write(f"Once the task is complete, you can download the result from the website.\n")
                        f.write(f"Or you can use the check_and_download_task function with your task ID.\n")
                    
                    return {'task_id': extracted_task_id, 'status': 'polling_failed', 'info_file': info_file_path}
            else:
                logging.error(f"API request failed: {response_json.get('msg')}")
                return None
        except Exception as e:
            logging.error(f"Error processing video with Zhaoli API: {e}")
            return None
    else:
        # Use the original AWS-based method
        bucket_name = "taylorswiftnyu"
        s3_key = "first_detected_text_frame.png"
        extract_frames(input_path, access_key_id, secret_access_key, region_name, bucket_name, selected_font, 'output_video.mp4')
        if os.path.exists('output_video.mp4'):
            os.rename('merged_video.mp4', output_path)
            os.remove('output_video.mp4')
            os.remove('extracted_audio.wav')
            delete_s3_object(bucket_name, s3_key, access_key_id, secret_access_key, region_name)
        else:
            logging.error("output_video.mp4 does not exist. Process aborted.")
    gc.collect()  # Explicitly call garbage collection
    return None
