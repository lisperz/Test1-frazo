import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from video_processing import process_video

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Thread-safe counter for tracking progress
progress_lock = Lock()
completed_tasks = 0
total_tasks = 0

def process_single_video(video_info):
    """
    Process a single video with automatic text inpainting
    """
    global completed_tasks
    
    video_path, output_path, task_id = video_info
    
    # Set output folder for this batch
    output_folder = "/Users/zhuchen/Downloads/Test1-frazo/Process_61-80_After"
    output_filename = os.path.basename(output_path)
    full_output_path = os.path.join(output_folder, output_filename)
    
    # Load configurations
    with open('zhaoli_config.json', 'r') as f:
        config = json.load(f)
    
    app_key = config['app_key']
    app_secret = config['app_secret']
    ghostcut_uid = config['ghostcut_uid']
    
    # Load AWS credentials from CSV file
    with open('harshilsuvarna_accessKeys.csv', 'r') as f:
        lines = f.readlines()
        if len(lines) > 1:
            aws_line = lines[1].strip().split(',')
            aws_access_key = aws_line[0]
            aws_secret_key = aws_line[1]
        else:
            logging.error(f"Could not read AWS credentials for {video_path}")
            return {"video_path": video_path, "status": "failed", "error": "No AWS credentials"}
    
    if not os.path.exists(video_path):
        logging.error(f"Video not found: {video_path}")
        return {"video_path": video_path, "status": "failed", "error": "Video not found"}
    
    video_name = os.path.basename(video_path)
    logging.info(f"Starting processing for: {video_name}")
    
    try:
        # Use the existing process_video function with automatic text detection
        result = process_video(
            input_path=video_path,
            output_path=full_output_path,
            access_key_id=aws_access_key,
            secret_access_key=aws_secret_key,
            region_name="us-east-1",
            selected_font="Arial.ttf",
            use_zhaoli_api=True,
            app_key=app_key,
            app_secret=app_secret,
            ghostcut_uid=ghostcut_uid
        )
        
        # Update progress counter
        with progress_lock:
            global completed_tasks
            completed_tasks += 1
            logging.info(f"📊 Progress: {completed_tasks}/{total_tasks} videos processed")
        
        if result and result.get('status') == 'completed':
            logging.info(f"{video_name} - Processing completed successfully!")
            return {
                "video_path": video_path,
                "output_path": full_output_path,
                "status": "completed",
                "task_id": result.get('task_id'),
                "file_size": os.path.getsize(full_output_path) / (1024 * 1024) if os.path.exists(full_output_path) else 0
            }
        elif result and result.get('task_id'):
            logging.info(f"{video_name} - Task submitted, may still be processing...")
            return {
                "video_path": video_path,
                "output_path": full_output_path,
                "status": "processing",
                "task_id": result.get('task_id'),
                "info_file": result.get('info_file')
            }
        else:
            logging.error(f"{video_name} - Failed to submit task")
            return {
                "video_path": video_path,
                "status": "failed",
                "error": "Failed to submit task"
            }
            
    except Exception as e:
        logging.error(f"{video_name} - Error during processing: {e}")
        return {
            "video_path": video_path,
            "status": "failed",
            "error": str(e)
        }

def batch_process_videos(video_paths, max_workers=3):
    """
    Process multiple videos simultaneously using ThreadPoolExecutor
    """
    global total_tasks, completed_tasks
    
    # Prepare video processing tasks with correct naming convention
    video_tasks = []
    for i, video_path in enumerate(video_paths):
        video_name = os.path.basename(video_path).replace('.mp4', '')
        # Use the correct naming convention with "-text" suffix
        output_path = f"{video_name}-text.mp4"
        video_tasks.append((video_path, output_path, i + 1))
    
    total_tasks = len(video_tasks)
    completed_tasks = 0
    
    print("BATCH AUTOMATIC TEXT INPAINTING")
    print("=" * 60)
    print(f"Total videos: {total_tasks}")
    print(f"Method: needChineseOcclude=1 (automatic text detection)")
    print(f"Processing mode: Concurrent ({max_workers} workers)")
    print(f"Model: advanced_lite (high quality)")
    print("=" * 60)
    
    # Display all videos to be processed
    for i, (video_path, output_path, task_id) in enumerate(video_tasks):
        print(f"{i+1}. {os.path.basename(video_path)} → {output_path}")
    
    print("\nStarting batch processing...")
    start_time = time.time()
    
    results = []
    
    # Process videos concurrently
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasksaad
        future_to_video = {
            executor.submit(process_single_video, video_info): video_info 
            for video_info in video_tasks
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_video):
            video_info = future_to_video[future]
            try:
                result = future.result()
                results.append(result)
                
                video_name = os.path.basename(result['video_path'])
                if result['status'] == 'completed':
                    print(f"COMPLETED: {video_name}")
                elif result['status'] == 'processing':
                    print(f"PROCESSING: {video_name} (ID: {result.get('task_id')})")
                else:
                    print(f"FAILED: {video_name} - {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                video_path = video_info[0]
                video_name = os.path.basename(video_path)
                print(f"EXCEPTION: {video_name} - {e}")
                results.append({
                    "video_path": video_path,
                    "status": "failed",
                    "error": f"Exception: {e}"
                })
    
    # Summary
    end_time = time.time()
    total_time = end_time - start_time
    
    print("\n" + "=" * 60)
    print("BATCH PROCESSING SUMMARY")
    print("=" * 60)
    
    completed_count = sum(1 for r in results if r['status'] == 'completed')
    processing_count = sum(1 for r in results if r['status'] == 'processing')
    failed_count = sum(1 for r in results if r['status'] == 'failed')
    
    print(f"Total videos: {total_tasks}")
    print(f"Completed: {completed_count}")
    print(f"Processing: {processing_count}")
    print(f"Failed: {failed_count}")
    print(f"Total time: {total_time/60:.1f} minutes")
    
    if processing_count > 0:
        print(f"\n{processing_count} videos are still processing and will complete shortly.")
        print("Check the output folder for completed videos.")
    
    return results

def main():
    """
    Main function to run batch processing on all videos in Process_61-80_original folder
    """
    # Automatically scan Process_61-80_original folder for all MP4 videos
    testcases_folder = "/Users/zhuchen/Downloads/Test1-frazo/Process_61-80_original"
    
    if not os.path.exists(testcases_folder):
        print(f"TestCases folder not found: {testcases_folder}")
        return
    
    # Get all MP4 files in the TestCases folder
    video_paths = []
    for file in os.listdir(testcases_folder):
        if file.endswith('.mp4') and not file.startswith('.'):
            video_path = os.path.join(testcases_folder, file)
            video_paths.append(video_path)
    
    if not video_paths:
        print(f"No MP4 videos found in: {testcases_folder}")
        return
    
    print(f"FOUND {len(video_paths)} VIDEOS TO PROCESS")
    print("=" * 60)
    for i, video_path in enumerate(video_paths, 1):
        video_name = os.path.basename(video_path)
        output_name = video_name.replace('.mp4', '-text.mp4')
        print(f"{i}. {video_name} → {output_name}")
    
    # Create output folder for this batch
    output_folder = "/Users/zhuchen/Downloads/Test1-frazo/Process_61-80_After"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created output folder: {output_folder}")
    else:
        print(f"Using existing output folder: {output_folder}")
    
    print("\nStarting batch processing with automatic text inpainting...")
    print("Using needChineseOcclude=1 for automatic text detection")
    print("No manual bounding boxes required!")
    print("Processing ALL videos simultaneously!")
    
    # Process ALL videos simultaneously - no worker limit!
    max_workers = len(video_paths)  # Process ALL videos at once
    print(f"Using {max_workers} concurrent workers - processing ALL videos at once!")
    
    results = batch_process_videos(video_paths, max_workers=max_workers)
    
    # Save results to JSON file
    results_file = f"batch_inpaint_results_{int(time.time())}.json"
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to: {results_file}")

if __name__ == "__main__":
    main() 