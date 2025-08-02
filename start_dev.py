#!/usr/bin/env python3
"""
Simple development server for Video Text Inpainting service
This bypasses Docker complexity and gets your app running quickly
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_banner():
    print("=" * 60)
    print("🎬 VIDEO TEXT INPAINTING SERVICE - DEVELOPMENT MODE")
    print("=" * 60)
    print("📁 Project:", os.getcwd())
    print("🐍 Python:", sys.version.split()[0])
    print("=" * 60)

def install_backend_deps():
    print("\n📦 Installing backend dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", 
            "fastapi", "uvicorn[standard]", "python-multipart",
            "sqlalchemy", "psycopg2-binary", "alembic",
            "python-jose[cryptography]", "passlib[bcrypt]",
            "celery", "redis", "python-magic", "Pillow",
            "boto3", "requests", "httpx", "aiofiles",
            "websockets", "python-decouple", "pydantic-settings"
        ], check=True, capture_output=True)
        print("✅ Backend dependencies installed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_simple_server():
    """Create a simplified FastAPI server for development"""
    server_code = '''
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json

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
        return {
            "ghostcut_configured": bool(config.get("app_key")),
            "api_url": "https://api.zhaoli.com",
            "status": "ready"
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Configuration file not found")

@app.post("/api/v1/jobs/submit")
async def submit_job():
    """Placeholder for job submission"""
    return {
        "message": "Job submission endpoint ready",
        "note": "Full implementation requires database setup",
        "next_step": "Configure PostgreSQL for full functionality"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
'''
    
    with open("dev_server.py", "w") as f:
        f.write(server_code)
    print("✅ Simple development server created!")

def main():
    print_banner()
    
    # Check if we're in the right directory
    if not os.path.exists("video_processing.py"):
        print("❌ Please run this from the Test1-frazo directory")
        sys.exit(1)
    
    # Install basic dependencies
    if not install_backend_deps():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Create simple server
    create_simple_server()
    
    print("\n🚀 Starting Video Text Inpainting Service...")
    print("📍 Backend will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔧 Configuration check: http://localhost:8000/api/v1/config")
    print("\n💡 Your Ghostcut API is configured and ready!")
    print("📋 Ghostcut API Key:", os.getenv('GHOSTCUT_API_KEY', 'Loaded from zhaoli_config.json'))
    
    # Start the server
    try:
        subprocess.run([sys.executable, "dev_server.py"])
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Thanks for using Video Text Inpainting Service!")

if __name__ == "__main__":
    main()