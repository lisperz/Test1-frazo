# Pro Video Editor - Current Status

**Last Updated**: October 18, 2025
**Status**: ✅ SEGMENTS API WORKING - Needs background worker fix

---

## ✅ PROBLEM SOLVED

The Pro Video Editor with Sync.so segments API is now **WORKING**!

### Successful Test Job
- **Job ID**: `f57ed7f6-1bac-4176-aab9-5f96f8b9b8e8`
- **Sync.so Generation ID**: `823bd5ed-a3cc-4600-96af-d4b1dca714f1`
- **Status**: COMPLETED ✅
- **Output**: Successfully processed and downloaded
- **Download URL**: `https://taylorswiftnyu.s3.amazonaws.com/users/.../pro_result_f57ed7f6-1bac-4176-aab9-5f96f8b9b8e8.mp4`

---

## 🔧 Root Cause & Solution

### The Problem
Sync.so was rejecting all segment submissions with error: **"The segments configuration is invalid"**

### The Solution (3 fixes applied)

1. **Removed invalid `label` field** from segments payload
   - Location: `frontend/src/components/VideoEditor/Pro/ProVideoEditor.tsx:660-664`
   - The API spec doesn't include a `label` field in segments

2. **Don't send audioInput times when not cropping audio**
   - Location: `frontend/src/components/VideoEditor/Pro/ProVideoEditor.tsx:644-666`
   - Only include `audioInput.startTime/endTime` when user explicitly enables audio cropping
   - Otherwise, just send `{refId: "audio-xxx"}` without times

3. **Added `sync_mode: "remap"` option**
   - Location: `backend/services/sync_segments_service.py:114-116`
   - Tells Sync.so to adjust video playback speed to match audio duration
   - This is the default mode for segmented generations

### Working Payload Example
```json
{
  "model": "lipsync-2",
  "input": [
    {"type": "video", "url": "https://..."},
    {"type": "audio", "url": "https://...", "refId": "audio-1"},
    {"type": "audio", "url": "https://...", "refId": "audio-2"}
  ],
  "segments": [
    {
      "startTime": 0,
      "endTime": 1.8,
      "audioInput": {"refId": "audio-1"}  // NO startTime/endTime = use full audio
    },
    {
      "startTime": 2,
      "endTime": 3.2,
      "audioInput": {"refId": "audio-2"}  // NO startTime/endTime = use full audio
    }
  ],
  "options": {
    "sync_mode": "remap"  // Adjust playback speed automatically
  }
}
```

**Result**: `status: "COMPLETED"` ✅

---

## ⚠️ REMAINING ISSUE: Background Worker

### Problem
Pro jobs complete on Sync.so but stay as "processing" in the UI because the background worker doesn't poll for completion.

### What Was Done
1. ✅ Updated `backend/api/routes/pro_sync_api.py:266` to save `zhaoli_task_id` (Sync.so generation ID) to database
2. ✅ Created new Celery task `check_pro_job_completion()` in `backend/workers/video_tasks.py:603-714`
3. ✅ Added periodic schedule in `backend/workers/celery_app.py:87-90` (runs every 60 seconds)
4. ❌ **Docker cache issue**: Worker containers not picking up new code despite rebuilds

### Temporary Workaround
Manually completed the test job using Python script:
```bash
docker-compose exec -T backend python3 -c "
# Downloads result from Sync.so, uploads to S3, updates job status
"
```

### Next Session TODO
Fix Docker worker rebuild issue so the periodic task `check_pro_job_completion` runs automatically.

**Files to check:**
- `backend/workers/video_tasks.py` (line 603): Task definition
- `backend/workers/celery_app.py` (line 87): Periodic schedule
- Dockerfile.worker: Build process

**Quick test:**
```bash
# Check if task is registered
docker exec test1-frazo-worker-1 celery -A backend.workers.celery_app inspect registered | grep check_pro

# Should show: backend.workers.video_tasks.check_pro_job_completion
```

---

## 🎯 How to Use Pro Video Editor

### Frontend Usage
1. Navigate to Pro Video Editor page
2. Upload video file
3. Create segments by:
   - Setting segment time range (e.g., 0-2s, 2-4s)
   - Uploading audio file for each segment
   - **Do NOT enable "Crop Audio"** unless you want to use only part of the audio
4. Click Submit
5. Job will be sent to Sync.so and processed

### Expected Flow
1. Frontend sends segments data to `/api/v1/sync/pro-sync-process`
2. Backend uploads video + audio files to S3
3. Backend calls Sync.so API with segments configuration
4. Sync.so returns generation ID and starts processing
5. (Automatic once worker fixed) Background task polls Sync.so every 60 seconds
6. When complete, downloads result video from Sync.so
7. Uploads to S3 and updates job status to "completed"
8. User can download from Jobs page

---

## 📁 Key Code Locations

### Backend
- **Pro Sync API**: `backend/api/routes/pro_sync_api.py`
  - Line 266: Saves generation ID to `zhaoli_task_id`
  - Endpoint: `/api/v1/sync/pro-sync-process`

- **Sync Service**: `backend/services/sync_segments_service.py`
  - Line 50-154: `create_segmented_lipsync()` - Builds and sends payload
  - Line 156-236: `check_generation_status()` - Polls Sync.so for status
  - Line 114-116: Added `sync_mode: "remap"` option

- **Background Worker**: `backend/workers/video_tasks.py`
  - Line 603-714: `check_pro_job_completion()` task (NOT WORKING YET - Docker cache issue)

- **Periodic Tasks**: `backend/workers/celery_app.py`
  - Line 87-90: Schedule for Pro job polling

### Frontend
- **Pro Video Editor**: `frontend/src/components/VideoEditor/Pro/ProVideoEditor.tsx`
  - Line 644-666: Builds segments payload (fixed to not include label, only include audio times when cropping)

---

## 🧪 Quick Commands

### Check Pro Job Status
```bash
# Get latest Pro job from database
docker-compose exec -T db psql -U vti_user -d video_text_inpainting \
  -c "SELECT id, status, zhaoli_task_id, output_url FROM video_jobs WHERE is_pro_job = TRUE ORDER BY created_at DESC LIMIT 1;"

# Check Sync.so status (replace with actual generation ID)
docker-compose exec -T backend python3 -c "
import asyncio, json
from backend.services.sync_segments_service import sync_segments_service
result = asyncio.run(sync_segments_service.check_generation_status('GENERATION_ID_HERE'))
print(json.dumps(result, indent=2))
"
```

### Manually Complete a Job
```bash
# If worker isn't running, manually download and complete
docker-compose exec -T backend python3 -c "
import asyncio
from backend.models.database import SessionLocal
from backend.models.job import VideoJob, JobStatus
from backend.services.sync_segments_service import sync_segments_service
from backend.services.s3_service import s3_service
import aiohttp, tempfile, os
from datetime import datetime

async def complete_job():
    job_id = 'JOB_ID_HERE'
    generation_id = 'GENERATION_ID_HERE'

    db = SessionLocal()
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()

    status_result = await sync_segments_service.check_generation_status(generation_id)
    output_url = status_result.get('outputUrl')

    async with aiohttp.ClientSession() as session:
        async with session.get(output_url) as response:
            video_data = await response.read()

    output_filename = f'pro_result_{job_id}.mp4'
    s3_key = f'users/{job.user_id}/jobs/{job_id}/{output_filename}'

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
        tmp_file.write(video_data)
        tmp_path = tmp_file.name

    try:
        result_url = s3_service.upload_video_and_get_url(tmp_path, s3_key)
        job.status = JobStatus.COMPLETED.value
        job.output_url = result_url
        job.progress_percentage = 100
        job.progress_message = 'Pro video processing completed'
        job.completed_at = datetime.utcnow()
        db.commit()
        print(f'Completed: {result_url}')
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    db.close()

asyncio.run(complete_job())
"
```

---

## 📞 Configuration

### Sync.so API
- **API Key**: `sk-6YLR3N7qQcidA2tTeTWCZg.gQ4IrWevs5KJR-RTy38nHZJmaW53jP6m`
- **Endpoint**: `https://api.sync.so/v2/generate`
- **Model**: `lipsync-2`
- **Auth Header**: `x-api-key` (NOT `Authorization: Bearer`)

### Database
- **Container**: `vti-database` (postgres)
- **Connection**: `postgresql://vti_user:vti_password_123@db:5432/video_text_inpainting`

---

## 🎯 Next Session Goal

**Fix Docker worker rebuild issue** so `check_pro_job_completion()` periodic task runs automatically.

**Success Criteria**:
- Task appears in `celery inspect registered`
- New Pro jobs automatically complete without manual intervention
- Jobs page shows "completed" status with download link

**Debugging Strategy**:
1. Check if `backend/workers/video_tasks.py` in container has 713 lines (not 599)
2. If not, investigate why Docker COPY isn't getting latest files
3. Try full rebuild with `--no-cache` or manually copy files into running container
4. Restart all workers to pick up new code
