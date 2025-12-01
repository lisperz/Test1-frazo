# Quick Start Guide - Video Text Inpainting Service

**For Developers** | **5-Minute Setup**

---

## 🚀 Get Started in 3 Steps

### Step 1: Authentication

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer"
}
```

### Step 2: Upload & Process Video

```bash
curl -X POST http://localhost:8000/api/v1/video-editors/sync/pro-sync-process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@video.mp4" \
  -F "audio_files=@audio1.mp3" \
  -F "audio_files=@audio2.mp3" \
  -F 'segments_data=[
    {
      "startTime": 0.0,
      "endTime": 15.0,
      "audioInput": {"refId": "audio-1", "duration": 15.0},
      "label": "Segment 1"
    },
    {
      "startTime": 15.0,
      "endTime": 30.0,
      "audioInput": {"refId": "audio-2", "duration": 15.0},
      "label": "Segment 2"
    }
  ]'
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### Step 3: Check Status & Download

```bash
curl -X GET http://localhost:8000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result_url": "https://s3.amazonaws.com/bucket/result.mp4"
}
```

---

## 📊 Key Features at a Glance

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Multi-Segment Lip-Sync** | `POST /pro-sync-process` | Replace audio with AI lip-sync (2-5 segments) |
| **Text Removal** | `POST /simple-inpaint` | Remove watermarks/subtitles automatically |
| **Real-time Updates** | WebSocket `/ws` | Get live progress notifications |
| **Chunked Upload** | `POST /chunked-upload/*` | Upload large files (>100MB) |

---

## 🔑 Important Concepts

### Segments

A **segment** defines:
- **Time range** in video (`startTime`, `endTime`)
- **Audio file** to replace with (`refId`)
- **Audio cropping** (optional: `audioInput.startTime/endTime`)

```json
{
  "startTime": 10.0,
  "endTime": 25.0,
  "audioInput": {
    "refId": "audio-1",
    "duration": 20.0,
    "startTime": 5.0,    // Use audio from 5s to 20s
    "endTime": 20.0
  },
  "label": "My Segment"
}
```

### Audio Cropping

**Why?** When splitting segments, you need to tell the API which part of the audio to use.

**Example**:
- Video: 30 seconds
- Audio file: 20 seconds
- Segment 1 (0-15s): Use audio 0-15s
- Segment 2 (15-30s): **Can't use full audio** → Use audio 5-20s

---

## 🎯 Common Use Cases

### Use Case 1: Simple Dubbing (1 audio file)

```json
{
  "segments": [
    {
      "startTime": 0.0,
      "endTime": 30.0,
      "audioInput": {"refId": "audio-1", "duration": 30.0}
    }
  ]
}
```

### Use Case 2: Split Dubbing (2+ audio files)

```json
{
  "segments": [
    {
      "startTime": 0.0,
      "endTime": 15.0,
      "audioInput": {"refId": "audio-1", "duration": 15.0}
    },
    {
      "startTime": 15.0,
      "endTime": 30.0,
      "audioInput": {"refId": "audio-2", "duration": 15.0}
    }
  ]
}
```

### Use Case 3: Audio Cropping

```json
{
  "segments": [
    {
      "startTime": 0.0,
      "endTime": 10.0,
      "audioInput": {
        "refId": "audio-1",
        "duration": 20.0,
        "startTime": 0.0,
        "endTime": 10.0
      }
    },
    {
      "startTime": 10.0,
      "endTime": 20.0,
      "audioInput": {
        "refId": "audio-1",
        "duration": 20.0,
        "startTime": 10.0,
        "endTime": 20.0
      }
    }
  ]
}
```

---

## ⚠️ Important Limitations

| Limitation | Value | Notes |
|------------|-------|-------|
| **Max file size** | 2GB | Use chunked upload for larger files |
| **Max segments** | 5 (Pro), 10 (Enterprise) | Per video |
| **Max concurrent jobs** | 3 (Pro), 10 (Enterprise) | Per user |
| **Rate limit** | 60 req/min (Pro) | Per API key |

---

## 🐛 Troubleshooting

### Error: "Multiple segments with same audio must provide crop times"

**Solution**: Add `startTime` and `endTime` to `audioInput` for each segment.

```json
"audioInput": {
  "refId": "audio-1",
  "duration": 20.0,
  "startTime": 0.0,    // ✅ Required
  "endTime": 15.0      // ✅ Required
}
```

### Error: "Insufficient credits"

**Solution**: Purchase more credits or upgrade subscription tier.

### Error: "File too large"

**Solution**: Use chunked upload API:

```bash
# 1. Initialize upload
curl -X POST http://localhost:8000/api/v1/chunked-upload/init \
  -H "Authorization: Bearer TOKEN" \
  -d '{"filename": "video.mp4", "total_size": 104857600, "chunk_size": 5242880}'

# 2. Upload chunks
for i in {0..19}; do
  curl -X POST http://localhost:8000/api/v1/chunked-upload/chunk/UPLOAD_ID \
    -F "chunk=@chunk_${i}.bin" \
    -F "chunk_index=${i}"
done

# 3. Complete upload
curl -X POST http://localhost:8000/api/v1/chunked-upload/complete/UPLOAD_ID
```

---

## 🔗 Resources

- **Full Documentation**: [docs/INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **API Reference**: http://localhost:8000/docs
- **GitHub**: https://github.com/your-repo
- **Support**: support@your-domain.com

---

## 📞 Need Help?

1. Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed docs
2. View API Swagger UI: http://localhost:8000/docs
3. Contact support: support@your-domain.com

**Happy coding! 🚀**
