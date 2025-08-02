# Video Text Processing with Zhaoli API

A Flask web application that automatically removes text from videos using the Zhaoli API and downloads the processed results to your local folder.

## Features

- **Automatic Text Removal**: Uses Zhaoli API Advanced Lite model to remove text from videos
- **Real-time Status Tracking**: Monitors processing status and automatically downloads completed videos
- **Auto-polling**: Checks task status every 60 seconds until completion
- **Local Storage**: Downloads processed videos directly to your `static/videos/` folder
- **Manual Controls**: Check status and manage tasks through web interface

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Credentials

Create or edit `zhaoli_config.json`:
```json
{
    "app_key": "your_zhaoli_app_key",
    "app_secret": "your_zhaoli_app_secret",
    "ghostcut_uid": "your_ghostcut_uid"
}
```

### 3. AWS Credentials
Ensure `harshilsuvarna_accessKeys.csv` contains your AWS credentials for S3 uploads.

## Usage

### 1. Start the Application
```bash
python pixelapplication.py
```

### 2. Access Web Interface
Open `http://localhost:5000` in your browser

### 3. Process Videos
1. Upload a video file (mp4, avi, mov, mkv)
2. Select a font for translated text
3. Click "Upload and Process"
4. Monitor status - videos are automatically downloaded when ready

## How It Works

1. **Upload**: Video is uploaded and saved locally
2. **S3 Upload**: Video is uploaded to S3 to get a public URL
3. **API Request**: Creates a text removal task with Zhaoli API
4. **Polling**: Automatically checks task status every 30 seconds
5. **Download**: Downloads processed video when task completes
6. **Local Storage**: Saves processed video as `processed_[filename].mp4`

## File Structure

```
pixelregen/
├── pixelapplication.py          # Main Flask application
├── video_processing.py          # Video processing and API logic
├── templates/upload.html        # Web interface
├── static/videos/              # Upload and processed videos
├── fonts/                      # Font files for text overlay
├── zhaoli_config.json          # API credentials
└── harshilsuvarna_accessKeys.csv # AWS credentials
```

## Configuration

### Video Processing Settings
- **Text Region**: Bottom 20% of video (0.56 to 0.76 height)
- **Model**: Advanced Lite - Single Box
- **Languages**: All languages removed
- **Resolution**: 1080p

### Polling Settings
- **Check Interval**: 30 seconds
- **Max Attempts**: 60 (30 minutes total)
- **Auto-check**: Enabled by default in web interface

## API Costs

Each video processing request costs money through the Zhaoli API. Monitor your usage on the GhostCut dashboard.

## Troubleshooting

### Common Issues
- **Task not completing**: Real processing takes 5-30 minutes depending on video length
- **Download fails**: Check network connection and Zhaoli API status
- **Videos not showing**: Verify `static/videos/` folder permissions
- **API errors**: Verify credentials in `zhaoli_config.json`

### Status Checking
If automatic download fails, you can:
1. Use the "Check Status" button in the web interface
2. Check the GhostCut website manually with your task ID
3. Look for `*_task_info.txt` files with task details

## Production Notes

- Monitor API usage and costs on GhostCut dashboard
- Ensure adequate storage space in `static/videos/` folder
- Consider implementing cleanup for old processed videos
- Set up proper logging for production deployment 