# Pro Video Editor API Testing Guide

## Phase 4 Backend Implementation - Testing Documentation

---

## 🎯 Overview

This document provides testing instructions for the Pro Video Editor backend API (Phase 4).

**Status**: ✅ Backend API implemented with PLACEHOLDERS for Sync.so multi-segment API

**What's Implemented:**
- ✅ Database migration (segments_data JSONB, is_pro_job BOOLEAN)
- ✅ VideoJob model updated with Pro fields
- ✅ Multi-audio S3 upload service
- ✅ Pydantic schemas for Pro API
- ✅ Subscription tier validation (Pro/Enterprise)
- ✅ `/api/v1/sync/pro-sync-process` endpoint
- ✅ Pro job status endpoint
- ⚠️ Sync.so API integration (PLACEHOLDERS - waiting for API docs)

---

## 🔧 Prerequisites

1. **Run Database Migration:**
```bash
# Apply the segments migration
psql -U vti_user -d video_text_inpainting -f database/migrations/add_pro_segments_support.sql
```

2. **Restart Backend:**
```bash
./scripts/restart.sh backend
```

3. **Verify Pro User:**
Ensure your test user has Pro or Enterprise subscription tier.

---

## 📝 API Endpoints

### 1. Pro Sync Process (Create Segmented Job)

**Endpoint:** `POST /api/v1/sync/pro-sync-process`

**Authentication:** Required (JWT Bearer token) + Pro/Enterprise tier

**Request Format:** `multipart/form-data`

**Parameters:**
- `file` (file): Main video file
- `audio_files` (file[]): Array of audio files (one per segment)
- `segments_data` (string): JSON array of segment configurations
- `display_name` (string, optional): Job display name
- `effects` (string, optional): JSON string of text removal effects

**Example segments_data:**
```json
[
  {
    "startTime": 0.0,
    "endTime": 15.0,
    "audioInput": {
      "refId": "audio-1",
      "startTime": null,
      "endTime": null
    },
    "label": "Intro Segment"
  },
  {
    "startTime": 15.0,
    "endTime": 30.0,
    "audioInput": {
      "refId": "audio-2",
      "startTime": 5.0,
      "endTime": 20.0
    },
    "label": "Main Segment"
  }
]
```

**Response:**
```json
{
  "job_id": "uuid",
  "sync_generation_id": null,
  "segments_count": 2,
  "status": "queued",
  "message": "Pro job created successfully with 2 segments..."
}
```

---

### 2. Get Pro Job Status

**Endpoint:** `GET /api/v1/sync/pro-job/{job_id}/status`

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "job_id": "uuid",
  "status": "queued",
  "progress": 0,
  "message": null,
  "segments_data": {
    "segments": [...],
    "total_segments": 2
  },
  "created_at": "2025-10-09T...",
  "completed_at": null,
  "output_url": null
}
```

---

## 🧪 Testing with cURL

### Test 1: Create Pro Job with 2 Segments

```bash
# Get your JWT token first
TOKEN="your-jwt-token-here"

# Prepare test files
VIDEO_FILE="path/to/test-video.mp4"
AUDIO_FILE_1="path/to/audio1.mp3"
AUDIO_FILE_2="path/to/audio2.mp3"

# Create segments JSON
SEGMENTS_JSON='[
  {
    "startTime": 0.0,
    "endTime": 15.0,
    "audioInput": {"refId": "audio-1", "startTime": null, "endTime": null},
    "label": "First Segment"
  },
  {
    "startTime": 15.0,
    "endTime": 30.0,
    "audioInput": {"refId": "audio-2", "startTime": null, "endTime": null},
    "label": "Second Segment"
  }
]'

# Make API call
curl -X POST http://localhost:8000/api/v1/sync/pro-sync-process \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$VIDEO_FILE" \
  -F "audio_files=@$AUDIO_FILE_1" \
  -F "audio_files=@$AUDIO_FILE_2" \
  -F "segments_data=$SEGMENTS_JSON" \
  -F "display_name=Test Pro Job"
```

### Test 2: Check Job Status

```bash
# Use job_id from previous response
JOB_ID="your-job-id-here"

curl http://localhost:8000/api/v1/sync/pro-job/$JOB_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing with Postman

### Setup

1. Create new collection: "Pro Video Editor API"
2. Add environment variable:
   - `BASE_URL`: `http://localhost:8000`
   - `TOKEN`: Your JWT token

### Test 1: Pro Sync Process

1. **Method:** POST
2. **URL:** `{{BASE_URL}}/api/v1/sync/pro-sync-process`
3. **Headers:**
   - `Authorization`: `Bearer {{TOKEN}}`
4. **Body:** form-data
   - `file`: (file) Select video file
   - `audio_files`: (file) Select first audio file
   - `audio_files`: (file) Select second audio file (add row with same key)
   - `segments_data`: (text) Paste JSON array
   - `display_name`: (text) "Postman Test Job"

5. **Send** and verify response

### Test 2: Get Job Status

1. **Method:** GET
2. **URL:** `{{BASE_URL}}/api/v1/sync/pro-job/{{JOB_ID}}/status`
3. **Headers:**
   - `Authorization`: `Bearer {{TOKEN}}`
4. **Send** and verify response

---

## ✅ Validation Tests

### Test Subscription Tier Validation

**Expected:** Free users should get 403 Forbidden

```bash
# Login as free tier user
FREE_TOKEN="free-user-token"

curl -X POST http://localhost:8000/api/v1/sync/pro-sync-process \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -F "file=@test.mp4" \
  -F "audio_files=@audio.mp3" \
  -F "segments_data=[...]"

# Expected response:
# {"detail": "Pro Video Editor requires Pro or Enterprise subscription..."}
```

### Test Segment Count Limits

**Pro Tier:** Max 5 segments
**Enterprise Tier:** Max 10 segments

```bash
# Try with 6 segments as Pro user
SEGMENTS_JSON='[...6 segments...]'

curl -X POST http://localhost:8000/api/v1/sync/pro-sync-process \
  -H "Authorization: Bearer $PRO_TOKEN" \
  -F "file=@video.mp4" \
  -F "audio_files=@audio1.mp3" \
  # ... 6 audio files total
  -F "segments_data=$SEGMENTS_JSON"

# Expected response:
# {"detail": "Your subscription allows maximum 5 segments"}
```

### Test Segment Validation

**Test Overlapping Segments:**
```json
[
  {"startTime": 0, "endTime": 20, "audioInput": {"refId": "a1"}},
  {"startTime": 15, "endTime": 30, "audioInput": {"refId": "a2"}}
]
```
Expected: 400 Bad Request with validation error

**Test Invalid Time Range:**
```json
[
  {"startTime": 25, "endTime": 20, "audioInput": {"refId": "a1"}}
]
```
Expected: 400 Bad Request - Start time must be before end time

---

## 🔍 Database Verification

### Check Job Record

```sql
SELECT
  id,
  user_id,
  original_filename,
  is_pro_job,
  segments_data,
  status,
  created_at
FROM video_jobs
WHERE is_pro_job = TRUE
ORDER BY created_at DESC
LIMIT 5;
```

### Check Segments Data Structure

```sql
SELECT
  id,
  segments_data->'total_segments' as segment_count,
  jsonb_array_length(segments_data->'segments') as segments_array_length,
  segments_data
FROM video_jobs
WHERE is_pro_job = TRUE;
```

---

## ⚠️ Known Limitations (Phase 4)

### Sync.so API Integration - PLACEHOLDERS

The following parts contain placeholders awaiting API documentation:

1. **Sync.so API Request Structure** (`sync_segments_service.py`):
   - Model name placeholder
   - Input structure for multi-audio
   - Segments array format
   - Options configuration

2. **Background Processing** (`pro_sync_api.py`):
   - Line 181: `background_tasks.add_task()` commented out
   - Actual Celery worker implementation pending

3. **Job Monitoring:**
   - WebSocket updates not yet implemented
   - Polling mechanism not active

### What Works Now:

✅ File uploads (video + multiple audio files)
✅ S3 uploads with refId mapping
✅ Job creation with segments_data
✅ Subscription tier validation
✅ Segment validation (overlaps, time ranges)
✅ Pro job status retrieval

### What's Pending (Week 5):

⏳ Sync.so API call with segments array
⏳ Background job processing workflow
⏳ WebSocket real-time progress updates
⏳ Frontend submit button integration
⏳ End-to-end testing

---

## 📊 Success Criteria (Phase 4)

- [x] Database schema supports segments
- [x] API endpoint accepts multi-file uploads
- [x] Subscription tier validation works
- [x] Segment validation prevents overlaps
- [x] S3 upload service handles multiple audio files
- [x] Job records store segments_data correctly
- [x] API returns proper error messages
- [ ] Sync.so API integration (waiting for docs)
- [ ] Background processing workflow (Week 5)

---

## 🚀 Next Steps (Week 5)

1. **Receive Sync.so Multi-Segment API Documentation**
2. **Replace Placeholders** in `sync_segments_service.py`
3. **Implement Background Worker** for Pro jobs
4. **Connect Frontend Submit Button** to API
5. **Add WebSocket Progress Updates**
6. **End-to-End Testing** with real Sync.so API

---

## 📝 Notes

- All API endpoints follow project standards (< 300 lines per file)
- Strong TypeScript typing enforced in Pydantic models
- Comprehensive error handling and validation
- Logging configured for debugging
- Ready for Phase 5 integration once Sync.so docs arrive

---

**Phase 4 Status**: ✅ **COMPLETE** (Backend API Ready)
**Date**: 2025-10-09
**Developer**: Zhu Chen
