# GhostCut Chaining Fix - Final Summary

**Status**: 🟡 **IMPLEMENTATION COMPLETE - DEPLOYMENT IN PROGRESS**

**Date**: October 20, 2025

---

## Issue Summary

Pro Video Editor jobs with annotation areas (text inpainting) are **not chaining to GhostCut** after Sync.so completes. The feature is fully implemented in code but has deployment issues.

---

## Root Causes Identified

### 1. ✅ **Import Path Errors** (FIXED IN CODE)
**File**: `backend/workers/video_tasks/pro_jobs.py`

**Error**:
```python
from backend.services.s3_service import s3_service  # ❌ Wrong
```

**Fix Applied**:
```python
from backend.services.s3 import s3_service  # ✅ Correct
```

### 2. ✅ **Double-Encoded Effects JSON** (FIXED IN CODE)
**File**: `backend/api/routes/video_editors/sync/routes.py`

**Problem**: Frontend sends JSON string, backend was storing it as string within JSON

**Fix Applied**: Handle double-encoded JSON gracefully
```python
parsed = json.loads(effects)
if isinstance(parsed, str):
    effects_list = json.loads(parsed)  # Parse again
elif isinstance(parsed, list):
    effects_list = parsed
```

### 3. ✅ **Celery Task Registration** (FIXED IN CODE)
**File**: `backend/workers/celery_app.py`

**Problem**: Beat schedule used short task names, but tasks registered with full module paths

**Fix Applied**: Updated beat schedule to use full paths
```python
'check-pro-job-completion': {
    'task': 'backend.workers.video_tasks.core_tasks.check_pro_job_completion',  # ✅ Full path
    'schedule': 60.0,
}
```

### 4. 🔄 **Docker Image Not Updated** (IN PROGRESS)
**Problem**: Code changes are on host, but workers run from cached Docker image

**Solution Needed**: Rebuild worker Docker image

---

## Current Deployment Status

### ✅ Code Changes Complete
- [x] Fixed import paths in `pro_jobs.py`
- [x] Fixed double-encoding handler in routes
- [x] Fixed Celery task registration in `celery_app.py`
- [x] Fixed existing jobs' effects in database

### 🔄 Docker Rebuild In Progress
- [ ] Worker image rebuild (timed out due to network/build cache)
- [x] Backend restarted
- [x] Beat service updated

---

## Quick Fix Steps

Since Docker builds are timing out, here's the fastest way to deploy:

### Option 1: Fast Rebuild (Recommended)
```bash
# Stop workers
docker-compose stop worker

# Quick rebuild using cache (faster)
docker-compose build worker

# Start workers
docker-compose up -d worker

# Verify
docker-compose logs -f worker | grep "annotation\|GhostCut"
```

### Option 2: Force Complete Restart
```bash
# Nuclear option - rebuild everything
docker-compose down
docker-compose build
docker-compose up -d

# Wait 2 minutes for services to stabilize
sleep 120

# Monitor
docker-compose logs -f worker
```

### Option 3: Manual Code Copy (If builds keep failing)
```bash
# Copy code directly into running container
docker cp backend/workers/video_tasks/pro_jobs.py test1-frazo-worker-1:/app/backend/workers/video_tasks/
docker cp backend/workers/video_tasks/pro_jobs.py test1-frazo-worker-2:/app/backend/workers/video_tasks/

# Restart workers
docker-compose restart worker
```

---

## Expected Workflow After Fix

### Complete Chained Processing

1. **User Submission**
   - Video file
   - 2 segments (lip-sync audio)
   - 1+ annotation areas (text removal regions)

2. **Sync.so Processing** (Progress: 0-60%)
   ```
   [Worker] Checking Sync.so generation {id} for job {job_id}
   [Worker] Job {job_id}: Sync.so status = COMPLETED
   [Worker] Job {job_id}: Downloading Sync.so result from https://...
   [Worker] Job {job_id}: Sync.so result uploaded to S3: https://...
   ```

3. **GhostCut Chain Detection** (Progress: 60%)
   ```
   [Worker] Job {job_id}: Found 1 annotation areas. Starting GhostCut text inpainting...
   [Worker] Job {job_id}: Starting GhostCut processing with 1 annotation areas
   [Worker] GhostCut request: 1 masks, mode=2
   [Worker] GhostCut task created: {ghostcut_id}
   ```

4. **GhostCut Processing** (Progress: 60-95%)
   ```
   [Worker] Checking 0 Sync.so jobs and 1 GhostCut jobs
   [Worker] Job {job_id}: Checking GhostCut task {ghostcut_id}
   [Worker] Job {job_id}: GhostCut still processing (85%)
   ```

5. **Completion** (Progress: 100%)
   ```
   [Worker] Job {job_id}: GhostCut completed. Downloading result from https://...
   [Worker] Job {job_id}: Successfully completed with chained processing. Final result: https://...
   ```

---

## Verification Checklist

After deployment, verify:

### ✅ Services Running
```bash
docker-compose ps
# All services should be "healthy"
```

### ✅ No Import Errors
```bash
docker-compose logs worker --since 2m | grep "No module named"
# Should return nothing
```

### ✅ Tasks Registered
```bash
docker-compose logs worker-1 --tail 50 | grep "\[tasks\]" -A 15
# Should show: backend.workers.video_tasks.core_tasks.check_pro_job_completion
```

### ✅ Jobs Being Checked
```bash
docker-compose logs -f worker | grep "Checking.*Sync.so jobs"
# Should show: Checking X Sync.so jobs and Y GhostCut jobs
```

### ✅ New Job Submission Works
```bash
# Submit new Pro job with segments + annotation areas
# Watch logs:
docker-compose logs -f worker | grep -E "annotation|GhostCut|chaining"
```

---

## Test Plan

1. **Submit Test Job**
   - 1 video file (Test1_Original_English.mp4)
   - 2 segments (0-2s, 2.1-3.5s)
   - 1 annotation area (erasure, x:0.3, y:0.3, w:0.4, h:0.4, 4.1-8.3s)

2. **Monitor Processing**
   ```bash
   # Watch job progress
   watch -n 5 'docker-compose exec db psql -U vti_user -d video_text_inpainting -c "SELECT id, status, progress_percentage, progress_message FROM video_jobs WHERE is_pro_job = TRUE ORDER BY created_at DESC LIMIT 1;" -x'

   # Watch worker logs
   docker-compose logs -f worker | grep -E "Job.*annotation|GhostCut"
   ```

3. **Expected Timeline**
   - T+0min: Job submitted, status=processing
   - T+1-2min: Sync.so completes lip-sync
   - T+2min: Worker detects annotation areas, chains to GhostCut
   - T+3-5min: GhostCut processes text inpainting
   - T+5min: Job completes, final video available

4. **Check GhostCut Workstation**
   - Log into GhostCut dashboard
   - Should see 1 new job with video name matching job ID
   - Job should show as completed

---

## Database Queries for Debugging

### Check Job Status
```sql
SELECT
  id,
  status,
  progress_percentage,
  progress_message,
  processing_config->'effects' as effects,
  job_metadata->'ghostcut_task_id' as ghostcut_id,
  job_metadata->'sync_generation_id' as sync_id
FROM video_jobs
WHERE is_pro_job = TRUE
ORDER BY created_at DESC
LIMIT 5;
```

### Check Effects Format
```sql
SELECT
  id,
  jsonb_typeof(processing_config->'effects') as effects_type,
  processing_config->'effects'
FROM video_jobs
WHERE is_pro_job = TRUE
  AND processing_config ? 'effects';
```

### Find Jobs Stuck in Processing
```sql
SELECT
  id,
  status,
  created_at,
  now() - created_at as age,
  progress_message
FROM video_jobs
WHERE status = 'processing'
  AND created_at < now() - interval '30 minutes';
```

---

## Known Issues

### Issue 1: Effects Double-Encoding
**Symptom**: effects stored as JSON string instead of array
**Detection**: `processing_config->'effects'` shows `"[{...}]"` instead of `[{...}]`
**Fix**: Restart backend after applying route changes

### Issue 2: Import Errors
**Symptom**: `No module named 'backend.services.s3_service'`
**Detection**: Worker logs show import errors
**Fix**: Rebuild worker image with corrected imports

### Issue 3: Task Not Registered
**Symptom**: `Received unregistered task of type 'backend.workers.video_tasks.check_pro_job_completion'`
**Detection**: Worker logs show KeyError for task names
**Fix**: Rebuild beat service with updated `celery_app.py`

---

## Files Modified

1. **backend/workers/video_tasks/pro_jobs.py** (536 lines)
   - Fixed import: `backend.services.s3_service` → `backend.services.s3`
   - Added chained processing logic

2. **backend/api/routes/video_editors/sync/routes.py**
   - Added double-encoding handler for effects

3. **backend/workers/celery_app.py**
   - Updated beat schedule task paths to full module paths

4. **Database** (Manual SQL)
   - Fixed effects format in existing jobs

---

## Next Steps

1. **Complete Worker Rebuild**
   ```bash
   docker-compose build worker
   docker-compose up -d worker
   ```

2. **Submit New Test Job**
   - With both segments and annotation areas
   - Monitor logs for "annotation areas" message

3. **Verify GhostCut Workstation**
   - Check if job appears in GhostCut dashboard
   - Verify job completes

4. **Clean Up Test Jobs**
   ```sql
   DELETE FROM video_jobs WHERE status = 'processing' AND created_at < now() - interval '1 hour';
   ```

---

## Success Criteria

✅ Worker logs show: "Found X annotation areas. Starting GhostCut text inpainting..."
✅ Worker logs show: "GhostCut task created: {task_id}"
✅ Worker logs show: "Successfully completed with chained processing"
✅ GhostCut workstation shows new job
✅ Final video has both lip-sync and text removal applied

---

**Current Blocker**: Worker Docker image rebuild needed to apply import path fixes.

**Workaround**: Use Option 3 (manual code copy) if builds continue to timeout.
