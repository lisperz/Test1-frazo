import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import { CloudUpload, VideoFile, PlayArrow, Delete } from '@mui/icons-material';
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 4 }}>
      {!selectedFile && (
        <Box
          {...getRootProps()}
          sx={{
            p: 6,
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            borderStyle: 'dashed',
            borderWidth: 3,
            borderColor: isDragActive ? 'primary.main' : 
                        uploading ? '#a0aec0' : '#e2e8f0',
            backgroundColor: isDragActive ? 'rgba(102,126,234,0.05)' : 
                            uploading ? 'rgba(160,174,192,0.05)' : 'transparent',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: uploading ? '#a0aec0' : 'primary.main',
              backgroundColor: uploading ? 'rgba(160,174,192,0.05)' : 'rgba(102,126,234,0.05)',
              transform: uploading ? 'none' : 'translateY(-2px)',
            },
          }}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <Box>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto',
                mb: 3,
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              }}>
                <CloudUpload sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: '#2d3748'
              }}>
                Uploading Video...
              </Typography>
              <Box sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ color: '#52c41a', fontWeight: 600 }}>
                {uploadProgress}% complete
              </Typography>
            </Box>
          ) : (
            <Box>
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto',
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}>
                <VideoFile sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: '#2d3748'
              }}>
                {isDragActive ? 'Drop the video here...' : 'Drag & Drop Video Here'}
              </Typography>
              <Typography variant="h6" sx={{ 
                color: '#718096',
                mb: 4,
                fontWeight: 400
              }}>
                or click to select a video file from your computer
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  borderRadius: '25px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102,126,234,0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Browse Files
              </Button>
              <Typography variant="body2" sx={{ 
                color: '#a0aec0',
                mt: 3,
                fontSize: '0.95rem'
              }}>
                Supported formats: MP4, MPEG, MOV, AVI (Max 2GB)
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 3, 
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(239,68,68,0.15)'
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Show file selected and processing options */}
      {selectedFile && localUrl && !uploading && (
        <Card sx={{ 
          mt: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            p: 3,
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ 
                background: 'rgba(255,255,255,0.2)',
                mr: 2,
                width: 48,
                height: 48
              }}>
                <VideoFile sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Video Ready for Processing
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </Typography>
              </Box>
              <Avatar sx={{
                background: 'rgba(255,255,255,0.2)',
                width: 40,
                height: 40
              }}>
                <PlayArrow />
              </Avatar>
            </Box>
          </Box>
          
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body1" sx={{ color: '#2d3748', mb: 3 }}>
              Your video has been successfully uploaded and is ready for editing. Click "Manual Edit & Annotate" to proceed to the editor where you can mark specific areas for text removal.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => onUpload(selectedFile, localUrl)}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  borderRadius: '25px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102,126,234,0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Manual Edit & Annotate
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Delete />}
                onClick={() => {
                  setSelectedFile(null);
                  setLocalUrl(null);
                  setUploadProgress(0);
                }}
                sx={{
                  borderColor: '#ff4d4f',
                  color: '#ff4d4f',
                  borderRadius: '25px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ff7875',
                    backgroundColor: 'rgba(255,77,79,0.05)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Remove & Try Again
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VideoUpload;