#!/usr/bin/env python3
"""
Manual script to check and update job statuses from GhostCut API
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import hashlib
import json
import time

# Database connection
DATABASE_URL = "postgresql://vti_user:vti_password_123@localhost:5432/video_text_inpainting"

# GhostCut API credentials
GHOSTCUT_API_KEY = "fb518b019d3341e2a3a32e730d0797c9"
GHOSTCUT_APP_SECRET = "fcbc542efcb44a198dd53c451503fd04"
GHOSTCUT_API_URL = "https://api.zhaoli.com"

def get_ghostcut_status(job_id):
    """Check status of a job in GhostCut API"""
    try:
        url = f"{GHOSTCUT_API_URL}/v-w-c/gateway/ve/work/status"
        
        request_data = {
            "idProjects": [int(job_id)]
        }
        
        body = json.dumps(request_data)
        
        # Calculate signature
        md5_1 = hashlib.md5()
        md5_1.update(body.encode('utf-8'))
        body_md5hex = md5_1.hexdigest()
        md5_2 = hashlib.md5()
        body_md5hex = (body_md5hex + GHOSTCUT_APP_SECRET).encode('utf-8')
        md5_2.update(body_md5hex)
        sign = md5_2.hexdigest()
        
        headers = {
            'Content-type': 'application/json',
            'AppKey': GHOSTCUT_API_KEY,
            'AppSign': sign,
        }
        
        response = requests.post(url, json=request_data, headers=headers, timeout=30)
        
        print(f"    API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"    API Error: HTTP {response.status_code}")
            print(f"    Response: {response.text}")
            return None
        
        result = response.json()
        print(f"    API Response: {json.dumps(result, indent=2)}")
        
        if result.get("code") == 1000:
            body_data = result.get("body", {})
            content = body_data.get("content", [])
            
            if content:
                task_data = content[0]
                process_status = task_data.get("processStatus", 0)
                process_progress = task_data.get("processProgress", 0.0)
                video_url = task_data.get("videoUrl", "")
                
                # processStatus: 1 = completed, 0 = processing
                if process_status == 1 and video_url:
                    return {
                        "status": "completed",
                        "progress": 100,
                        "output_url": video_url
                    }
                else:
                    return {
                        "status": "processing",
                        "progress": int(process_progress),
                        "output_url": None
                    }
        
        return None
        
    except Exception as e:
        print(f"Error checking GhostCut status: {e}")
        return None

def main():
    """Main function to check and update job statuses"""
    
    print("Checking job statuses...")
    
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get all processing jobs with zhaoli_task_id
        cur.execute("""
            SELECT id, zhaoli_task_id, status, progress_percentage
            FROM video_jobs
            WHERE status = 'processing' AND zhaoli_task_id IS NOT NULL
        """)
        
        jobs = cur.fetchall()
        print(f"Found {len(jobs)} processing jobs")
        
        for job in jobs:
            job_id = job['id']
            zhaoli_task_id = job['zhaoli_task_id']
            
            print(f"\nChecking job {job_id} (Zhaoli ID: {zhaoli_task_id})...")
            
            # Check status from GhostCut API
            status_result = get_ghostcut_status(zhaoli_task_id)
            
            if status_result:
                print(f"  Status: {status_result['status']}")
                print(f"  Progress: {status_result['progress']}%")
                
                if status_result['status'] == 'completed' and status_result['output_url']:
                    print(f"  Output URL: {status_result['output_url']}")
                    
                    # Update job to completed
                    cur.execute("""
                        UPDATE video_jobs
                        SET status = 'completed',
                            progress_percentage = 100,
                            progress_message = 'Processing completed successfully',
                            output_url = %s,
                            completed_at = NOW()
                        WHERE id = %s
                    """, (status_result['output_url'], job_id))
                    
                    conn.commit()
                    print(f"  ✓ Job {job_id} marked as completed!")
                    
                elif status_result['status'] == 'processing':
                    # Update progress
                    cur.execute("""
                        UPDATE video_jobs
                        SET progress_percentage = %s,
                            progress_message = %s
                        WHERE id = %s
                    """, (status_result['progress'], f"Processing {status_result['progress']}% complete", job_id))
                    
                    conn.commit()
                    print(f"  → Job {job_id} still processing")
            else:
                print(f"  ⚠ Could not check status for job {job_id}")
        
        print("\n✓ Status check complete!")
        
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()