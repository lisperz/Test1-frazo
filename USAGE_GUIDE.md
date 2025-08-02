# Video Text Inpainting Pipeline - Usage Guide

## 🎯 Overview
This pipeline automatically removes text from videos using the Zhaoli API with automatic text detection.

## 📁 Essential Files
- `video_processing.py` - Core functionality (API interaction, S3 upload/download)
- `batch_automatic_inpaint.py` - Batch processing for multiple videos
- `unified_process.py` - **NEW**: Universal processing script for any folder
- `unified_download.py` - **NEW**: Universal download script for any results
- `zhaoli_config.json` - API configuration
- `harshilsuvarna_accessKeys.csv` - AWS S3 credentials

## 🚀 Quick Start

### 1. Process Videos from Any Folder
```bash
# Activate virtual environment
source .venv/bin/activate

# Process all videos in a folder
python unified_process.py /path/to/input/folder /path/to/output/folder

# Examples:
python unified_process.py TestCases
python unified_process.py "ES Translation of Casper's Videos" "ES Translation of Casper's Videos_Output"
python unified_process.py Process_60-100_original Process_60-100_After
```

### 2. Download Processed Videos
```bash
# Download from a results file
python unified_download.py results.json /path/to/output/folder

# Examples:
python unified_download.py process_60_100_inpaint_results_1752967452.json Process_60-100_After
python unified_download.py video_missed_inpaint_results_1752756744.json Video_Missed_Output
```

## 🔧 Features

### Automatic Text Detection
- Uses `needChineseOcclude=1` parameter
- No manual bounding box detection required
- Automatically detects and removes all text

### High Quality Processing
- Uses `advanced_lite` model for superior inpainting
- Maintains original video quality
- Preserves video timing and audio

### Concurrent Processing
- Processes all videos simultaneously
- No artificial limits on concurrency
- Efficient resource utilization

### Smart File Management
- Automatic naming: `original_name-text.mp4`
- Checks for existing files to avoid re-processing
- Copies from main output folder if available

## 📊 Output Structure

### Main Output Folder
All processed videos are stored in:
```
Processed_video_test/
├── video1-text.mp4
├── video2-text.mp4
└── ...
```

### Results Files
Processing results are saved as JSON files:
```
unified_inpaint_results_1234567890.json
```

## 🧹 Cleanup Summary

### Removed Redundant Files (Saved 807.87 MB):
- **Duplicate directories**: `Process_60-100_After`, `ES Translation of Casper's Videos_Output`
- **Redundant scripts**: 8 processing/download scripts with duplicate code
- **Old scripts**: 5 unused scripts
- **System files**: `.DS_Store`

### Current Essential Structure:
```
Test1-frazo/
├── video_processing.py          # Core functionality
├── batch_automatic_inpaint.py   # Batch processing
├── unified_process.py           # Universal processor
├── unified_download.py          # Universal downloader
├── Processed_video_test/        # All processed videos
├── zhaoli_config.json          # API configuration
├── requirements.txt            # Dependencies
└── [input folders]             # Original video folders
```

## 💡 Tips

1. **Always activate the virtual environment first**:
   ```bash
   source .venv/bin/activate
   ```

2. **Use the unified scripts** for new processing:
   - `unified_process.py` for processing
   - `unified_download.py` for downloading

3. **Check existing files** before processing:
   - The pipeline automatically skips already processed videos
   - Copies from main output folder if available

4. **Monitor progress**:
   - Processing status is shown in real-time
   - Results are saved to JSON files for tracking

## 🔄 Migration from Old Scripts

If you were using the old specific scripts:
- `process_60_100_videos.py` → `unified_process.py Process_60-100_original`
- `process_casper_videos.py` → `unified_process.py "ES Translation of Casper's Videos"`
- `download_60_100_videos.py` → `unified_download.py results.json`

The unified scripts provide the same functionality with better organization and less code duplication. 