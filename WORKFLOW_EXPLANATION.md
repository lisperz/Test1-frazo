# Text Inpainting Pipeline - Complete Workflow Explanation

## 🎯 Overview
Our text inpainting pipeline automatically removes text from videos using the Zhaoli API. The process involves multiple stages of data transfer between local storage, AWS S3, and the Zhaoli API.

## 🔄 Complete Data Flow

```
Local Video → S3 Upload → Zhaoli API → S3 Storage → Local Download
     ↓           ↓           ↓           ↓           ↓
  Input.mp4   S3 URL    Processing   Result URL   Output.mp4
```

## 📋 Detailed Step-by-Step Workflow

### **Phase 1: Local → S3 Upload**
**Function**: `upload_to_s3_and_get_url()`

```python
def upload_to_s3_and_get_url(video_path, access_key_id, secret_access_key, bucket_name="taylorswiftnyu"):
```

**What happens:**
1. **Local Video Read**: Reads the video file from your local storage
2. **S3 Client Creation**: Creates AWS S3 client with your credentials
3. **File Upload**: Uploads video to S3 bucket `taylorswiftnyu`
4. **Public URL Generation**: Creates a public URL for the uploaded video
5. **Return URL**: Returns `https://taylorswiftnyu.s3.amazonaws.com/filename.mp4`

**Example:**
```
Input: /Users/zhuchen/Downloads/Test1-frazo/TestCases/video.mp4
Output: https://taylorswiftnyu.s3.amazonaws.com/video.mp4
```

### **Phase 2: S3 → Zhaoli API Submission**
**Function**: `process_video()` (Zhaoli API section)

**What happens:**
1. **API Request Preparation**: Creates JSON request with video URL
2. **Authentication**: Generates MD5 signature using app_key and app_secret
3. **API Call**: Sends POST request to `https://api.zhaoli.com/v-w-c/gateway/ve/work/free`
4. **Task Creation**: API creates a processing task and returns task ID

**Request Structure:**
```json
{
    "urls": ["https://taylorswiftnyu.s3.amazonaws.com/video.mp4"],
    "uid": "your_ghostcut_uid",
    "workName": "Processed_video.mp4",
    "resolution": "1080p",
    "needChineseOcclude": 1,
    "videoInpaintLang": "all"
}
```

**Key Parameters:**
- `needChineseOcclude: 1` - Enables automatic text detection
- `videoInpaintLang: "all"` - Removes text in all languages
- `resolution: "1080p"` - Maintains high quality

### **Phase 3: Zhaoli API Processing**
**What happens on Zhaoli's servers:**
1. **Video Download**: API downloads video from S3 URL
2. **Text Detection**: AI automatically detects all text regions in the video
3. **Inpainting**: Uses advanced AI models to remove text and fill gaps
4. **Video Reconstruction**: Rebuilds video with text removed
5. **S3 Upload**: Uploads processed video to Zhaoli's S3 storage
6. **URL Generation**: Creates download URL for the processed video

**Processing Time**: Typically 2-10 minutes depending on video length and complexity

### **Phase 4: Status Polling**
**Function**: `poll_for_results()` and `check_task_status()`

**What happens:**
1. **Task ID Tracking**: Uses the task ID returned from Phase 2
2. **Status Checking**: Polls API every 30 seconds to check progress
3. **Progress Monitoring**: Tracks processing status (PENDING → PROCESSING → COMPLETED)
4. **URL Retrieval**: Gets download URL when processing is complete

**Status Check Request:**
```json
{
    "idProjects": [task_id]
}
```

**Status Response:**
```json
{
    "code": 1000,
    "body": {
        "content": [{
            "processStatus": 2,
            "processProgress": 100.0,
            "videoUrl": "https://zhaoli-s3.com/processed_video.mp4"
        }]
    }
}
```

### **Phase 5: S3 → Local Download**
**Function**: `download_video()`

**What happens:**
1. **URL Validation**: Verifies the download URL is accessible
2. **Streaming Download**: Downloads video in chunks to handle large files
3. **Progress Tracking**: Shows download progress for large files
4. **Local Save**: Saves processed video to your specified output path
5. **File Verification**: Ensures complete download

**Example:**
```
Input URL: https://zhaoli-s3.com/processed_video.mp4
Output: /Users/zhuchen/Downloads/Test1-frazo/Processed_video_test/video-text.mp4
```

## 🔧 Technical Implementation Details

### **Authentication Flow**
```python
# 1. Calculate body MD5
md5_1 = hashlib.md5()
md5_1.update(body.encode('utf-8'))
body_md5hex = md5_1.hexdigest()

# 2. Calculate signature
md5_2 = hashlib.md5()
body_md5hex = (body_md5hex + app_secret).encode('utf-8')
md5_2.update(body_md5hex)
sign = md5_2.hexdigest()

# 3. Set headers
headers = {
    'Content-type': 'application/json',
    'AppKey': app_key,
    'AppSign': sign,
}
```

### **Error Handling**
- **Network Timeouts**: 30-second timeout for API calls
- **Retry Logic**: Up to 60 polling attempts (30 minutes total)
- **Graceful Degradation**: Continues processing even if some videos fail
- **Logging**: Comprehensive logging for debugging

### **Concurrent Processing**
```python
# Process multiple videos simultaneously
with ThreadPoolExecutor(max_workers=len(video_paths)) as executor:
    future_to_video = {executor.submit(process_single_video, task): task for task in video_tasks}
```

## 📊 Data Transfer Summary

| Phase | From | To | Data Type | Size | Duration |
|-------|------|----|-----------|------|----------|
| 1 | Local | S3 | Video file | 10-50 MB | 30-60 seconds |
| 2 | S3 URL | Zhaoli API | URL string | ~100 bytes | 5-10 seconds |
| 3 | Zhaoli API | Zhaoli S3 | Processed video | 10-50 MB | 2-10 minutes |
| 4 | Zhaoli API | Local | Status updates | ~1 KB | 30 seconds intervals |
| 5 | Zhaoli S3 | Local | Processed video | 10-50 MB | 30-60 seconds |

## 🎯 Key Features

### **Automatic Text Detection**
- No manual bounding box selection required
- AI automatically identifies all text regions
- Works with multiple languages and fonts
- Handles dynamic text (moving, changing)

### **High Quality Processing**
- Uses `advanced_lite` model for superior inpainting
- Maintains original video resolution (up to 1080p)
- Preserves video timing and audio quality
- Seamless text removal with natural background filling

### **Robust Infrastructure**
- AWS S3 for reliable file storage
- Zhaoli API for professional-grade processing
- Concurrent processing for efficiency
- Comprehensive error handling and logging

## 🔍 Monitoring and Debugging

### **Logging Levels**
- **INFO**: Normal operation progress
- **WARNING**: Non-critical issues
- **ERROR**: Processing failures

### **Status Tracking**
- Real-time progress updates
- Task ID tracking for manual verification
- JSON results files for batch processing

### **Troubleshooting**
- Check S3 credentials and permissions
- Verify Zhaoli API keys and UID
- Monitor network connectivity
- Review API response codes and messages

## 💡 Best Practices

1. **Always activate virtual environment** before running scripts
2. **Use concurrent processing** for multiple videos
3. **Monitor disk space** for large batch processing
4. **Keep API credentials secure** in configuration files
5. **Check processing status** regularly for long-running tasks

This workflow ensures reliable, high-quality text removal from videos with minimal manual intervention and maximum efficiency. 