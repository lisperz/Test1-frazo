
import os
import logging
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Video Text Inpainting API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "🎬 Video Text Inpainting Service",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "video-text-inpainting"}

@app.get("/api/v1/config")
async def get_config():
    """Get current configuration"""
    try:
        with open("zhaoli_config.json", "r") as f:
            config = json.load(f)
        
        # Check AWS credentials
        aws_configured = bool(os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        return {
            "ghostcut_configured": bool(config.get("app_key") and config.get("app_secret")),
            "ghostcut_uid_configured": bool(config.get("ghostcut_uid")),
            "aws_configured": aws_configured,
            "api_url": "https://api.zhaoli.com",
            "workflow": "S3 -> Zhaoli API -> Download",
            "status": "ready" if aws_configured and config.get("app_key") and config.get("ghostcut_uid") else "needs_configuration"
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Configuration file not found")

@app.get("/api/v1/jobs/{job_id}/status")
async def check_job_status(job_id: str):
    """Check the status of a video processing job"""
    try:
        # Load Ghostcut config
        with open("zhaoli_config.json", "r") as f:
            config = json.load(f)
        
        # Check job status using Zhaoli API
        from zhaoli_processor import check_task_status
        
        app_key = config.get("app_key")
        app_secret = config.get("app_secret")
        
        result = check_task_status(app_key, app_secret, job_id)
        
        return {
            "job_id": job_id,
            "status_check": result,
            "message": "Job status retrieved from Ghostcut API"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@app.post("/api/v1/jobs/submit")
async def submit_job(file: UploadFile = File(...)):
    """Submit a video for text inpainting processing"""
    
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    
    # Save uploaded file temporarily
    import tempfile
    import shutil
    
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Get file info
        file_size = os.path.getsize(temp_path)
        
        # Load Ghostcut config
        with open("zhaoli_config.json", "r") as f:
            config = json.load(f)
        
        # Create output path
        output_path = temp_path.replace('_' + file.filename, f'_processed_{file.filename}')
        
        # Use simplified Zhaoli processor: S3 -> Zhaoli API (avoiding complex dependencies)
        try:
            from zhaoli_processor import process_video_simplified
            
            # Get AWS credentials from environment or config
            aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
            aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
            
            if not aws_access_key_id or not aws_secret_access_key:
                raise Exception("AWS credentials are required. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment or .env file")
            
            # Get Zhaoli API credentials
            app_key = config.get("app_key")
            app_secret = config.get("app_secret")
            ghostcut_uid = config.get("ghostcut_uid")
            
            if not app_key or not app_secret:
                raise Exception("Zhaoli API credentials not found in config")
                
            if not ghostcut_uid:
                raise Exception("ghostcut_uid is required in zhaoli_config.json")
            
            logging.info(f"Starting simplified S3 -> Zhaoli API workflow for {file.filename}")
            logging.info(f"Step 1: Upload to S3, Step 2: Submit to Zhaoli API for text inpainting")
            
            # Use simplified processor (no MoviePy/OpenCV dependencies)
            result = process_video_simplified(
                input_path=temp_path,
                output_path=output_path,
                access_key_id=aws_access_key_id,
                secret_access_key=aws_secret_access_key,
                app_key=app_key,
                app_secret=app_secret,
                ghostcut_uid=ghostcut_uid
            )
            
            return {
                "status": "processing_started",
                "filename": file.filename,
                "file_size": f"{file_size / (1024*1024):.2f} MB",
                "temp_path": temp_path,
                "ghostcut_config": {
                    "api_key": config.get("app_key", "")[:8] + "...",
                    "api_secret": config.get("app_secret", "")[:8] + "...",
                    "api_url": "https://api.zhaoli.com"
                },
                "processing_result": result,
                "task_id": result.get("task_id") if result else None,
                "message": "🎬 Video submitted to Ghostcut for text inpainting using your existing workflow!",
                "note": "Check your Ghostcut dashboard for processing progress"
            }
            
        except Exception as processing_error:
            # If processing fails, still return upload success with detailed error
            return {
                "status": "uploaded_ready_for_processing",
                "filename": file.filename,
                "file_size": f"{file_size / (1024*1024):.2f} MB",
                "temp_path": temp_path,
                "ghostcut_config": {
                    "api_key": config.get("app_key", "")[:8] + "...",
                    "api_url": "https://api.zhaoli.com"
                },
                "processing_error": str(processing_error),
                "error_details": "Make sure OpenCV is not required - using only Zhaoli API",
                "message": "🎬 Video uploaded successfully! Processing failed, but ready for retry."
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
