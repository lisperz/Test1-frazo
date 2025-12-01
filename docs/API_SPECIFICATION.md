# API Specification - Video Text Inpainting Service

**Version**: 1.0.0
**Base URL**: `http://localhost:8000/api/v1`
**Protocol**: REST + WebSocket
**Authentication**: JWT Bearer Token

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Pro Video Editor APIs](#pro-video-editor-apis)
3. [GhostCut Text Inpainting APIs](#ghostcut-text-inpainting-apis)
4. [Job Management APIs](#job-management-apis)
5. [File Upload APIs](#file-upload-apis)
6. [User & Admin APIs](#user--admin-apis)
7. [WebSocket Events](#websocket-events)
8. [Response Codes](#response-codes)
9. [Data Models](#data-models)

---

## Authentication APIs

### POST /auth/register

Register a new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response** `201 Created`:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "tier": "free",
  "credits": 100
}
```

---

### POST /auth/login

Authenticate and receive access token.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 1800
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 1800
}
```

---

### GET /auth/me

Get current user profile.

**Headers**: `Authorization: Bearer {token}`

**Response** `200 OK`:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "tier": "pro",
  "credits": 850,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## Pro Video Editor APIs

### POST /video-editors/sync/pro-sync-process

🔥 **Primary endpoint** for multi-segment lip-sync processing.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file` (file, required): Main video file
- `audio_files` (file[], required): Array of audio files
- `segments_data` (string, required): JSON array of segment configurations
- `display_name` (string, optional): Job display name
- `effects` (string, optional): JSON array of text removal effects

**Segments Data Format**:
```json
[
  {
    "startTime": 0.0,
    "endTime": 15.0,
    "audioInput": {
      "refId": "audio-1",
      "duration": 15.0,
      "startTime": 0.0,
      "endTime": 15.0
    },
    "label": "Intro",
    "color": "#FF9800"
  },
  {
    "startTime": 15.0,
    "endTime": 30.0,
    "audioInput": {
      "refId": "audio-2",
      "duration": 20.0,
      "startTime": 5.0,
      "endTime": 20.0
    },
    "label": "Main Content",
    "color": "#2196F3"
  }
]
```

**Effects Data Format** (optional):
```json
[
  {
    "type": "erasure",
    "startTime": 0.0,
    "endTime": 10.0,
    "coordinates": {
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 100
    }
  }
]
```

**Response** `201 Created`:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Job queued successfully",
  "segments_count": 2,
  "total_duration": 30.0,
  "estimated_credits": 30,
  "estimated_processing_time_minutes": 15
}
```

**Error Responses**:
- `400 Bad Request`: Invalid segments configuration
- `403 Forbidden`: Insufficient credits or exceeded segment limit
- `413 Payload Too Large`: File exceeds size limit

---

## GhostCut Text Inpainting APIs

### POST /video-editors/ghostcut/simple-inpaint

Simple text removal without lip-sync.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file` (file, required): Video file
- `display_name` (string, optional): Job display name
- `auto_detect` (boolean, default: true): Auto-detect text areas

**Response** `201 Created`:
```json
{
  "job_id": "uuid",
  "status": "queued",
  "message": "Job queued successfully"
}
```

---

### POST /video-editors/ghostcut/annotated-inpaint

Text removal with manual annotation areas.

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file` (file, required): Video file
- `annotations` (string, required): JSON array of annotation areas
- `display_name` (string, optional): Job display name

**Annotations Format**:
```json
[
  {
    "start_time": 0.0,
    "end_time": 10.0,
    "bbox": {
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 100
    },
    "type": "erasure"
  }
]
```

**Response** `201 Created`:
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

---

## Job Management APIs

### GET /jobs

List all jobs for current user.

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `status` (string, optional): Filter by status (queued, processing, completed, failed)
- `limit` (int, default: 20): Number of jobs to return
- `offset` (int, default: 0): Pagination offset

**Response** `200 OK`:
```json
{
  "jobs": [
    {
      "job_id": "uuid",
      "display_name": "My Project",
      "status": "completed",
      "progress": 100,
      "created_at": "2025-12-01T10:00:00Z",
      "completed_at": "2025-12-01T10:15:00Z",
      "result_url": "https://s3.amazonaws.com/bucket/result.mp4"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### GET /jobs/{job_id}

Get detailed job information.

**Headers**: `Authorization: Bearer {token}`

**Response** `200 OK`:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "display_name": "My Video Project",
  "status": "completed",
  "progress": 100,
  "created_at": "2025-12-01T10:00:00Z",
  "completed_at": "2025-12-01T10:15:00Z",
  "processing_time_seconds": 900,
  "result_url": "https://s3.amazonaws.com/bucket/result.mp4",
  "result_size_bytes": 52428800,
  "metadata": {
    "segments_count": 2,
    "video_duration": 30.0,
    "audio_files_count": 2,
    "effects_count": 1
  },
  "credits_used": 30
}
```

---

### DELETE /jobs/{job_id}

Cancel a job (only if status is 'queued').

**Headers**: `Authorization: Bearer {token}`

**Response** `200 OK`:
```json
{
  "message": "Job cancelled successfully",
  "credits_refunded": 30
}
```

**Error Responses**:
- `400 Bad Request`: Job already processing/completed
- `404 Not Found`: Job not found

---

## File Upload APIs

### POST /chunked-upload/init

Initialize chunked file upload for large files.

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "filename": "large_video.mp4",
  "total_size": 1048576000,
  "chunk_size": 5242880,
  "file_type": "video/mp4"
}
```

**Response** `201 Created`:
```json
{
  "upload_id": "upload-uuid",
  "chunk_count": 200,
  "expires_at": "2025-12-01T12:00:00Z"
}
```

---

### POST /chunked-upload/chunk/{upload_id}

Upload a file chunk.

**Headers**: `Authorization: Bearer {token}`

**Form Data**:
- `chunk` (file, required): File chunk
- `chunk_index` (int, required): Chunk index (0-based)

**Response** `200 OK`:
```json
{
  "upload_id": "upload-uuid",
  "chunk_index": 0,
  "chunks_received": 1,
  "chunks_total": 200
}
```

---

### POST /chunked-upload/complete/{upload_id}

Finalize chunked upload and merge chunks.

**Headers**: `Authorization: Bearer {token}`

**Response** `200 OK`:
```json
{
  "file_id": "file-uuid",
  "filename": "large_video.mp4",
  "file_size": 1048576000,
  "file_url": "https://s3.amazonaws.com/bucket/file.mp4"
}
```

---

## User & Admin APIs

### GET /users/credits

Get current user's credit balance.

**Headers**: `Authorization: Bearer {token}`

**Response** `200 OK`:
```json
{
  "credits": 850,
  "tier": "pro",
  "credits_per_minute": 1,
  "next_refill_date": "2025-02-01T00:00:00Z"
}
```

---

### POST /users/purchase-credits

Purchase additional credits.

**Headers**: `Authorization: Bearer {token}`

**Request**:
```json
{
  "package": "pro_1000",
  "payment_method": "stripe"
}
```

**Response** `200 OK`:
```json
{
  "transaction_id": "txn-uuid",
  "credits_added": 1000,
  "new_balance": 1850,
  "amount_paid": 99.99,
  "currency": "USD"
}
```

---

### GET /admin/stats (Admin Only)

Get system-wide statistics.

**Headers**: `Authorization: Bearer {admin_token}`

**Response** `200 OK`:
```json
{
  "total_users": 1250,
  "active_jobs": 15,
  "completed_jobs_today": 342,
  "total_storage_gb": 450.5,
  "average_processing_time_minutes": 12.5
}
```

---

## WebSocket Events

### Connect to WebSocket

```javascript
const socket = io('http://localhost:8000', {
  transports: ['websocket'],
  auth: {
    token: access_token
  }
});
```

---

### Event: `job_update`

Sent when job status changes.

**Payload**:
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 45,
  "message": "Processing segment 2 of 3",
  "timestamp": "2025-12-01T10:05:30Z"
}
```

---

### Event: `subscribe_job`

Subscribe to updates for a specific job.

**Emit**:
```javascript
socket.emit('subscribe_job', {
  job_id: '550e8400-e29b-41d4-a716-446655440000'
});
```

---

### Event: `unsubscribe_job`

Unsubscribe from job updates.

**Emit**:
```javascript
socket.emit('unsubscribe_job', {
  job_id: '550e8400-e29b-41d4-a716-446655440000'
});
```

---

## Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions or credits |
| 404 | Not Found | Resource not found |
| 413 | Payload Too Large | File exceeds size limit |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | External API error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Data Models

### User

```typescript
interface User {
  user_id: string;
  email: string;
  full_name: string;
  tier: 'free' | 'pro' | 'enterprise';
  role: 'user' | 'admin';
  credits: number;
  created_at: string;
  last_login: string;
}
```

---

### Job

```typescript
interface Job {
  job_id: string;
  user_id: string;
  display_name?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;  // 0-100
  job_type: 'pro_sync' | 'ghostcut_simple' | 'ghostcut_annotated';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result_url?: string;
  result_size_bytes?: number;
  error_message?: string;
  credits_used: number;
  metadata: Record<string, any>;
}
```

---

### Segment

```typescript
interface Segment {
  startTime: number;     // seconds
  endTime: number;       // seconds
  audioInput: {
    refId: string;       // Reference to audio file
    duration: number;    // Total audio duration
    startTime?: number;  // Audio crop start (optional)
    endTime?: number;    // Audio crop end (optional)
  };
  label?: string;
  color?: string;        // Hex color code
}
```

---

### Effect

```typescript
interface Effect {
  type: 'erasure' | 'protection' | 'text';
  startTime: number;
  endTime: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

---

## Rate Limits

| Tier | Requests/Minute | Concurrent Jobs | Max File Size |
|------|-----------------|-----------------|---------------|
| **Free** | 10 | 1 | 500 MB |
| **Pro** | 60 | 3 | 2 GB |
| **Enterprise** | 300 | 10 | 5 GB |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701432000
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_SEGMENT_CONFIG",
    "message": "Segment endTime must be greater than startTime",
    "details": {
      "segment_index": 1,
      "startTime": 15.0,
      "endTime": 10.0
    },
    "request_id": "req-uuid"
  }
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `limit` (int, default: 20, max: 100)
- `offset` (int, default: 0)

**Response**:
```json
{
  "data": [...],
  "total": 250,
  "limit": 20,
  "offset": 40,
  "has_more": true
}
```

---

## Versioning

API version is included in the base URL: `/api/v1`

Future versions will use: `/api/v2`, `/api/v3`, etc.

---

**Last Updated**: December 1, 2025
**API Version**: 1.0.0
**Support**: support@your-domain.com
