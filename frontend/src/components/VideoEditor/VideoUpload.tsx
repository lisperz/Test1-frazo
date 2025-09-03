import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, VideoFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface VideoUploadProps {
  onUpload: (file: File, url: string) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    // Simulate upload progress
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    };

    simulateProgress();

    // For now, just create a local URL for the video
    // This bypasses the backend upload temporarily
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setLocalUrl(url);
      setUploading(false);
      setUploadProgress(100);
    }, 1000);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Validate file type
        const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
        if (!validTypes.includes(file.type)) {
          setError('Please upload a valid video file (MP4, MPEG, MOV, AVI)');
          return;
        }
        
        // Validate file size (max 2GB)
        const maxSize = 2 * 1024 * 1024 * 1024;
        if (file.size > maxSize) {
          setError('File size must be less than 2GB');
          return;
        }
        
        uploadFile(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mpeg', '.mov', '.avi'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: uploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        
        <VideoFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        
        {uploading ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Uploading...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {uploadProgress}% complete
            </Typography>
          </Box>
        ) : isDragActive ? (
          <Typography variant="h6">Drop the video here...</Typography>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              Drag & drop a video here
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              or
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              disabled={uploading}
            >
              Browse Files
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              Supported formats: MP4, MPEG, MOV, AVI (Max 2GB)
            </Typography>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Show file selected and processing options */}
      {selectedFile && localUrl && !uploading && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onUpload(selectedFile, localUrl)}
            >
              Manual Edit & Annotate
            </Button>
            
            <Button
              variant="text"
              onClick={() => {
                setSelectedFile(null);
                setLocalUrl(null);
                setUploadProgress(0);
              }}
            >
              Remove
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Click "Manual Edit & Annotate" to proceed to the editor where you can mark specific areas for text removal.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default VideoUpload;