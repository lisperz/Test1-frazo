# Video Text Inpainting Service - Integration Guide

**Version**: 1.0.0
**Last Updated**: December 1, 2025
**Status**: Production Ready

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [API Reference](#api-reference)
5. [Integration Options](#integration-options)
6. [Workflow & Data Flow](#workflow--data-flow)
7. [External API Dependencies](#external-api-dependencies)
8. [Authentication & Security](#authentication--security)
9. [Environment Configuration](#environment-configuration)
10. [Deployment Architecture](#deployment-architecture)
11. [Performance & Scalability](#performance--scalability)
12. [Monitoring & Logging](#monitoring--logging)

---

## Executive Summary

### What is This Service?

**Video Text Inpainting Service** is a professional SaaS platform that provides AI-powered video editing capabilities:

- **Text Removal**: Automatically detect and remove text, subtitles, watermarks from videos
- **Lip-Sync**: Multi-segment audio replacement with precise lip-synchronization
- **Pro Video Editor**: Timeline-based editing with segment splitting and drag-and-drop

### Key Capabilities

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Text Inpainting** | Remove text/watermarks using AI | Content localization, rebranding |
| **Lip-Sync (Sync.so)** | Replace audio with lip movement sync | Dubbing, translations |
| **Multi-Segment Editing** | Split and manage audio segments | Complex dubbing projects |
| **Batch Processing** | Queue-based async processing | High-volume workflows |

### Business Model

- **Credit-Based**: Pay per video minute processed
- **Subscription Tiers**: Free (100 credits), Pro (1,000 credits), Enterprise (5,000 credits)
- **API Access**: RESTful API for developers on Pro+ plans

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  (Your Website, Mobile App, Desktop App, Third-party Services)  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (8000)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐        │
│  │ Auth Service │  │ Job Manager  │  │ File Handler  │        │
│  └──────────────┘  └──────────────┘  └───────────────┘        │
└────────────┬──────────────┬──────────────┬─────────────────────┘
             │              │              │
             ▼              ▼              ▼
┌────────────────┐  ┌──────────────────────────────┐
│  PostgreSQL 15 │  │   Redis 7 (Cache & Queue)    │
│   (Database)   │  └──────────────┬───────────────┘
└────────────────┘                 │
                                   ▼
                    ┌──────────────────────────────┐
                    │    Celery Workers (x2)       │
                    │   Background Processing      │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐      ┌───────────────────┐      ┌──────────────┐
│  Sync.so API  │      │  GhostCut/Zhaoli  │      │   AWS S3     │
│  (Lip-Sync)   │      │  (Text Inpainting)│      │  (Storage)   │
└───────────────┘      └───────────────────┘      └──────────────┘
```

### Component Breakdown

| Component | Purpose | Scaling Strategy |
|-----------|---------|------------------|
| **FastAPI Backend** | REST API, WebSocket, Authentication | Horizontal (multiple instances) |
| **Celery Workers** | Video processing, API calls | Horizontal (2+ workers) |
| **PostgreSQL** | Job metadata, user data | Vertical + read replicas |
| **Redis** | Queue, cache, WebSocket pub/sub | Redis Cluster |
| **S3** | Video/audio file storage | AWS managed |

---

## Technology Stack

### Backend Stack

```yaml
Language: Python 3.11+
Framework: FastAPI 0.104.1
ORM: SQLAlchemy 2.0.23
Task Queue: Celery 5.3.4
Cache/Broker: Redis 7
Database: PostgreSQL 15
File Storage: AWS S3
Video Processing: OpenCV, MoviePy, PIL, EasyOCR
```

### Frontend Stack

```yaml
Framework: React 19 (TypeScript)
UI Library: Material-UI
State Management: React Query + Zustand
Real-time: Socket.IO Client
Build Tool: React Scripts (CRA)
```

### Infrastructure

```yaml
Containerization: Docker + Docker Compose
Reverse Proxy: Nginx
Monitoring: Flower (Celery)
Logs: Centralized logging to /app/logs
Health Checks: Built-in endpoints
```

---

## API Reference

### Base URLs

```
Production:  https://api.your-domain.com
Development: http://localhost:8000
API Docs:    http://localhost:8000/docs (Swagger UI)
```

### Authentication

**Method**: JWT Bearer Token

```bash
# Login
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 1800
}

# Use Token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Core Endpoints

#### 1. **Pro Video Editor - Multi-Segment Lip-Sync**

> 🔥 **MOST IMPORTANT ENDPOINT** for integration

```http
POST /api/v1/video-editors/sync/pro-sync-process
Content-Type: multipart/form-data
Authorization: Bearer {access_token}

Parameters:
- file: (file) Main video file
- audio_files: (file[]) Array of audio files
- segments_data: (string) JSON array of segment configurations
- display_name: (string, optional) Job display name
- effects: (string, optional) JSON string of annotation areas for text removal
```

**Segments Data Structure**:

```json
[
  {
    "startTime": 0.0,
    "endTime": 15.0,
    "audioInput": {
      "refId": "audio-1",
      "duration": 15.0,
      "startTime": 0.0,    // Optional: crop audio start
      "endTime": 15.0      // Optional: crop audio end
    },
    "label": "Intro Segment",
    "color": "#FF9800"
  },
  {
    "startTime": 15.0,
    "endTime": 30.0,
    "audioInput": {
      "refId": "audio-2",
      "duration": 20.0,
      "startTime": 5.0,    // Use audio from 5s to 20s
      "endTime": 20.0
    },
    "label": "Main Content",
    "color": "#2196F3"
  }
]
```

**Effects Data Structure** (for text removal):

```json
[
  {
    "type": "erasure",  // or "protection" or "text"
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

**Response**:

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "message": "Job queued successfully",
  "segments_count": 2,
  "total_duration": 30.0,
  "estimated_credits": 30
}
```

#### 2. **Simple Text Inpainting (GhostCut)**

```http
POST /api/v1/video-editors/ghostcut/simple-inpaint
Content-Type: multipart/form-data

Parameters:
- file: (file) Video file
- display_name: (string, optional) Job display name
```

#### 3. **Job Status & Results**

```http
GET /api/v1/jobs/{job_id}
Authorization: Bearer {access_token}

Response:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",  // queued, processing, completed, failed
  "progress": 100,
  "result_url": "https://s3.amazonaws.com/bucket/result.mp4",
  "created_at": "2025-12-01T10:30:00Z",
  "completed_at": "2025-12-01T10:45:00Z",
  "metadata": {
    "segments_processed": 2,
    "total_duration": 30.0
  }
}
```

#### 4. **WebSocket - Real-time Updates**

```javascript
const socket = io('http://localhost:8000', {
  auth: {
    token: access_token
  }
});

// Listen for job updates
socket.on('job_update', (data) => {
  console.log('Job:', data.job_id);
  console.log('Status:', data.status);
  console.log('Progress:', data.progress);
});

// Subscribe to specific job
socket.emit('subscribe_job', { job_id: 'your-job-id' });
```

#### 5. **File Upload (Chunked)**

```http
POST /api/v1/chunked-upload/init
Content-Type: application/json

{
  "filename": "video.mp4",
  "total_size": 104857600,
  "chunk_size": 5242880
}

Response:
{
  "upload_id": "upload-uuid",
  "chunk_count": 20
}

---

POST /api/v1/chunked-upload/chunk/{upload_id}
Content-Type: multipart/form-data

Parameters:
- chunk: (file) File chunk
- chunk_index: (int) Chunk number (0-based)

---

POST /api/v1/chunked-upload/complete/{upload_id}
```

### API Rate Limits

| Tier | Rate Limit | Concurrent Jobs |
|------|------------|-----------------|
| **Free** | 10 req/min | 1 job |
| **Pro** | 60 req/min | 3 jobs |
| **Enterprise** | 300 req/min | 10 jobs |

---

## Integration Options

### Option 1: **Direct API Integration** (Recommended)

**Best For**: Full control, custom UI, server-side integration

```python
import requests

# 1. Authenticate
auth_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={
        'email': 'user@example.com',
        'password': 'password123'
    }
)
access_token = auth_response.json()['access_token']

# 2. Upload video and audio files
files = {
    'file': open('video.mp4', 'rb'),
    'audio_files': [
        open('audio1.mp3', 'rb'),
        open('audio2.mp3', 'rb')
    ]
}

segments_data = [
    {
        'startTime': 0.0,
        'endTime': 15.0,
        'audioInput': {'refId': 'audio-1', 'duration': 15.0},
        'label': 'Segment 1'
    },
    {
        'startTime': 15.0,
        'endTime': 30.0,
        'audioInput': {'refId': 'audio-2', 'duration': 15.0},
        'label': 'Segment 2'
    }
]

data = {
    'segments_data': json.dumps(segments_data),
    'display_name': 'My Video Project'
}

headers = {'Authorization': f'Bearer {access_token}'}

# 3. Submit job
response = requests.post(
    'http://localhost:8000/api/v1/video-editors/sync/pro-sync-process',
    files=files,
    data=data,
    headers=headers
)

job_id = response.json()['job_id']

# 4. Poll for status (or use WebSocket)
while True:
    status_response = requests.get(
        f'http://localhost:8000/api/v1/jobs/{job_id}',
        headers=headers
    )
    job_data = status_response.json()

    if job_data['status'] == 'completed':
        result_url = job_data['result_url']
        print(f'Download: {result_url}')
        break
    elif job_data['status'] == 'failed':
        print('Job failed:', job_data.get('error'))
        break

    time.sleep(5)  # Poll every 5 seconds
```

### Option 2: **Embedded iframe**

**Best For**: Quick integration, minimal development

```html
<iframe
  src="http://localhost/editor/pro?token={access_token}"
  width="100%"
  height="800px"
  frameborder="0"
></iframe>
```

### Option 3: **React Component Library** (Coming Soon)

**Best For**: React applications, full customization

```jsx
import { ProVideoEditor } from '@your-company/video-editor';

function MyApp() {
  return (
    <ProVideoEditor
      apiBaseUrl="http://localhost:8000"
      accessToken={token}
      onJobComplete={(job) => console.log('Done!', job)}
    />
  );
}
```

---

## Workflow & Data Flow

### Pro Video Editor Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Celery
    participant SyncAPI as Sync.so API
    participant GhostAPI as GhostCut API
    participant S3

    User->>Frontend: 1. Upload video + audio files
    Frontend->>Backend: 2. POST /pro-sync-process
    Backend->>S3: 3. Upload files to S3
    Backend->>Celery: 4. Queue processing job
    Backend-->>Frontend: 5. Return job_id

    Celery->>SyncAPI: 6. Submit segments for lip-sync
    SyncAPI-->>Celery: 7. Processing (polling status)
    SyncAPI-->>S3: 8. Upload synced video

    Celery->>GhostAPI: 9. Submit for text removal (if effects exist)
    GhostAPI-->>Celery: 10. Processing (polling status)
    GhostAPI-->>S3: 11. Upload final video

    Celery->>Backend: 12. Update job status
    Backend->>Frontend: 13. WebSocket notification
    Frontend->>User: 14. Display download link
```

### Processing Stages

| Stage | Duration | Description |
|-------|----------|-------------|
| **1. Upload** | 5-30s | Upload video + audio to S3 |
| **2. Validation** | <1s | Check file formats, user credits |
| **3. Queue** | <1s | Add to Celery queue |
| **4. Lip-Sync (Sync.so)** | 2-5x video duration | AI lip-sync processing |
| **5. Text Removal (GhostCut)** | 1-3x video duration | Optional text inpainting |
| **6. Finalization** | 5-10s | Upload result, update DB |

---

## External API Dependencies

### 1. **Sync.so API** (Lip-Sync)

**Purpose**: AI-powered lip-synchronization for audio replacement

**Endpoint**: `https://api.sync.so`
**Model**: `lipsync-2-pro`
**Documentation**: [sync.so/docs](https://sync.so/docs)

**Key Features**:
- Multi-segment audio replacement
- Audio cropping support (`startTime`, `endTime`)
- High-quality lip movement generation
- Supports 30+ languages

**Request Example**:

```json
{
  "video_url": "https://s3.amazonaws.com/bucket/video.mp4",
  "segments": [
    {
      "audio_url": "https://s3.amazonaws.com/bucket/audio1.mp3",
      "start_time": 0.0,
      "end_time": 15.0,
      "audio_start_time": 0.0,
      "audio_end_time": 15.0
    }
  ],
  "model": "lipsync-2-pro",
  "sync_mode": "remap"
}
```

**Limitations**:
- ⚠️ **Multiple segments with same audio**: Must provide `audio_start_time` and `audio_end_time` for each segment
- Max file size: 2GB
- Max duration: 10 minutes per request

### 2. **GhostCut/Zhaoli API** (Text Inpainting)

**Purpose**: AI-powered text removal and video inpainting

**Endpoint**: `https://api.zhaoli.com`
**Documentation**: [ghostcut.com/api](https://ghostcut.com/api)

**Key Features**:
- Automatic text detection
- Intelligent inpainting
- Multi-language OCR
- Batch processing

**Request Example**:

```json
{
  "video_url": "https://s3.amazonaws.com/bucket/video.mp4",
  "task_type": "text_removal",
  "auto_detect": true,
  "areas": [
    {
      "start_time": 0.0,
      "end_time": 10.0,
      "bbox": [100, 50, 200, 100]
    }
  ]
}
```

### 3. **AWS S3** (File Storage)

**Purpose**: Store video files, audio files, and results

**Bucket Structure**:

```
s3://your-bucket/
├── users/
│   └── {user_id}/
│       └── jobs/
│           └── {job_id}/
│               ├── input_video.mp4
│               ├── audio_1.mp3
│               ├── audio_2.mp3
│               ├── synced_video.mp4
│               └── final_result.mp4
└── temp/
    └── chunks/
```

**Pre-signed URLs**: Used for secure file downloads (expires in 1 hour)

---

## Authentication & Security

### JWT Token Structure

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "tier": "pro",  // free, pro, enterprise
  "role": "user",  // user, admin
  "exp": 1701432000,
  "iat": 1701430200
}
```

### Security Best Practices

1. **HTTPS Only**: All API calls must use HTTPS in production
2. **Token Expiration**: Access tokens expire in 30 minutes
3. **Refresh Tokens**: Use refresh tokens for long-lived sessions
4. **Rate Limiting**: Enforced at API gateway level
5. **CORS**: Configure allowed origins in `.env`
6. **File Validation**:
   - Max size: 2GB
   - Allowed formats: `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm`
   - MIME type verification
7. **Input Sanitization**: All inputs validated with Pydantic models

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://:password@host:6379/0
CELERY_BROKER_URL=redis://:password@host:6379/0
CELERY_RESULT_BACKEND=redis://:password@host:6379/0

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-2
AWS_S3_BUCKET=your-bucket-name

# Sync.so API (Pro Video Editor)
SYNC_API_KEY=your-sync-api-key
SYNC_API_URL=https://api.sync.so

# GhostCut API
GHOSTCUT_API_KEY=your-ghostcut-key
GHOSTCUT_APP_SECRET=your-app-secret
GHOSTCUT_UID=your-uid
GHOSTCUT_API_URL=https://api.zhaoli.com

# CORS
CORS_ORIGINS=https://your-website.com,https://app.your-website.com

# File Upload
MAX_UPLOAD_SIZE_MB=2000
UPLOAD_PATH=/app/uploads

# Environment
ENVIRONMENT=production  # development, staging, production
DEBUG=false
TZ=America/Chicago
```

---

## Deployment Architecture

### Docker Compose Stack

**6 Services**:

1. **PostgreSQL 15** - Database (port 5432)
2. **Redis 7** - Cache & message broker (port 6379)
3. **Backend API** - FastAPI (port 8000)
4. **Celery Worker** - Background processing (2 replicas)
5. **Celery Beat** - Periodic tasks scheduler
6. **Frontend** - React app via Nginx (port 80)
7. **Flower** - Celery monitoring (port 5555, optional)

### Deployment Commands

```bash
# Start all services
docker-compose up -d

# Scale workers
docker-compose up -d --scale worker=4

# View logs
docker-compose logs -f backend
docker-compose logs -f worker

# Health checks
curl http://localhost:8000/health
curl http://localhost/health
```

### Health Check Endpoints

```http
GET /health
Response: {"status": "healthy", "services": ["db", "redis", "celery"]}

GET /health/db
Response: {"status": "healthy", "latency_ms": 5}

GET /health/redis
Response: {"status": "healthy", "latency_ms": 2}
```

---

## Performance & Scalability

### Capacity Planning

| Metric | Current | Max (Single Node) | Scaling Strategy |
|--------|---------|-------------------|------------------|
| **Concurrent Jobs** | 10 | 50 | Horizontal worker scaling |
| **API Requests/sec** | 100 | 500 | Load balancer + multiple backends |
| **File Upload** | 2GB/file | N/A | Chunked upload, S3 direct upload |
| **Database Connections** | 20 | 100 | Connection pooling |

### Performance Optimization

1. **Caching**:
   - Redis cache for job status (TTL: 5 minutes)
   - S3 pre-signed URL cache (TTL: 1 hour)

2. **Database Optimization**:
   - Indexed columns: `job_id`, `user_id`, `status`, `created_at`
   - Query optimization with SQLAlchemy
   - Connection pooling (max 20 connections)

3. **Worker Scaling**:
   ```bash
   # Scale to 4 workers
   docker-compose up -d --scale worker=4
   ```

4. **CDN Integration**:
   - Use CloudFront for S3 file delivery
   - Reduce download latency by 80%

---

## Monitoring & Logging

### Monitoring Tools

1. **Flower** (Celery Monitoring):
   - URL: `http://localhost:5555`
   - View active tasks, worker status, task history

2. **Logs**:
   - Backend: `/app/logs/backend.log`
   - Worker: `/app/logs/worker.log`
   - Structured JSON logging

3. **Metrics** (Coming Soon):
   - Prometheus + Grafana
   - Job success rate, processing time, API latency

### Log Format

```json
{
  "timestamp": "2025-12-01T10:30:00.123Z",
  "level": "INFO",
  "service": "backend",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "message": "Job completed successfully",
  "duration_seconds": 180.5,
  "metadata": {
    "segments_count": 2,
    "video_duration": 30.0
  }
}
```

### Error Tracking

Common error codes:

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid segment configuration | Check segments_data format |
| 401 | Unauthorized | Refresh access token |
| 403 | Insufficient credits | Purchase more credits |
| 413 | File too large | Use chunked upload |
| 500 | External API error | Check Sync.so/GhostCut status |

---

## Support & Resources

### Documentation

- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **GitHub**: [github.com/your-repo](https://github.com/your-repo)
- **Status Page**: [status.your-domain.com](https://status.your-domain.com)

### Contact

- **Technical Support**: support@your-domain.com
- **Sales**: sales@your-domain.com
- **Slack**: #video-inpainting-api

### SLA

| Tier | Uptime | Support Response |
|------|--------|------------------|
| **Free** | 95% | 48 hours |
| **Pro** | 99% | 24 hours |
| **Enterprise** | 99.9% | 4 hours |

---

## Next Steps for Integration

### Phase 1: Authentication Setup
1. Create API credentials
2. Test authentication flow
3. Implement token refresh

### Phase 2: API Integration
1. Implement file upload (chunked for large files)
2. Call `/pro-sync-process` endpoint
3. Poll job status or use WebSocket

### Phase 3: Testing
1. Test with sample videos
2. Verify error handling
3. Load testing (if high volume)

### Phase 4: Production Deployment
1. Configure production environment variables
2. Set up monitoring and alerting
3. Implement CDN for file delivery
4. Go live! 🚀

---

**Questions?** Contact our integration team at integration@your-domain.com
