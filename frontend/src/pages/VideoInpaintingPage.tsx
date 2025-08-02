import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Stack,
  Fade,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  Download,
  CheckCircle,
  Error,
  Refresh,
  Delete,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface ProcessingJob {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  taskId?: string;
  downloadUrl?: string;
  error?: string;
  fileSize?: string;
}

const VideoInpaintingPage: React.FC = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const videoFile = acceptedFiles[0];
    if (!videoFile) return;

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    // Create new job
    const jobId = Date.now().toString();
    const newJob: ProcessingJob = {
      id: jobId,
      filename: videoFile.name,
      status: 'uploading',
      progress: 0,
      fileSize: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
    };

    setJobs(prev => [newJob, ...prev]);
    setIsUploading(true);

    try {
      // Upload video
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await axios.post('/api/v1/jobs/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setJobs(prev =>
            prev.map(job =>
              job.id === jobId ? { ...job, progress: percentCompleted } : job
            )
          );
        },
      });

      // Update job with processing status
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? {
                ...job,
                status: 'processing',
                progress: 0,
                taskId: response.data.task_id,
              }
            : job
        )
      );

      // Start polling for status
      pollJobStatus(jobId, response.data.task_id);
    } catch (error: any) {
      setJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? {
                ...job,
                status: 'error',
                error: error.response?.data?.detail || 'Upload failed',
              }
            : job
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const pollJobStatus = async (jobId: string, taskId: string) => {
    const maxAttempts = 60; // 30 minutes with 30-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/v1/jobs/${taskId}/status`);
        const statusData = response.data.status_check;

        if (statusData.status === 'status_check_successful') {
          const jobStatus = statusData.job_status;
          // Parse the actual job status from Zhaoli API response
          
          if (jobStatus.status === 'COMPLETED') {
            setJobs(prev =>
              prev.map(job =>
                job.id === jobId
                  ? {
                      ...job,
                      status: 'completed',
                      progress: 100,
                      downloadUrl: jobStatus.url,
                    }
                  : job
              )
            );
            return;
          } else if (jobStatus.status === 'PROCESSING') {
            const progress = jobStatus.progress || 0;
            setJobs(prev =>
              prev.map(job =>
                job.id === jobId ? { ...job, progress } : job
              )
            );
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000); // Poll every 30 seconds
        } else {
          setJobs(prev =>
            prev.map(job =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'error',
                    error: 'Processing timeout - check Ghostcut dashboard',
                  }
                : job
            )
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000);
        }
      }
    };

    poll();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    },
    multiple: false,
    disabled: isUploading,
  });

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const downloadVideo = (downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `processed_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'uploading':
        return 'info';
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Refresh className="animate-spin" />;
      case 'completed':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      default:
        return <VideoFile />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Text Inpainting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your video and remove text automatically using AI
        </Typography>
        <Chip 
          label="5 credits" 
          color="primary" 
          size="small" 
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
        elevation={0}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 4,
          }}
        >
          <CloudUpload
            sx={{
              fontSize: 64,
              color: 'text.secondary',
              mb: 2,
            }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop your video here'
              : 'Drag video here, or click to browse'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM (Max 100MB)
          </Typography>
          <Button
            variant="contained"
            disabled={isUploading}
            startIcon={<CloudUpload />}
          >
            Upload Video
          </Button>
        </Box>
      </Paper>

      {/* Processing Jobs */}
      {jobs.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Processing Queue
          </Typography>
          <Stack spacing={2}>
            {jobs.map((job) => (
              <Fade in key={job.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        {getStatusIcon(job.status)}
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Typography variant="subtitle1">
                            {job.filename}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {job.fileSize} • {job.taskId && `Task ID: ${job.taskId}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={job.status.toUpperCase()}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                        {job.status === 'completed' && job.downloadUrl && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Download />}
                            onClick={() => downloadVideo(job.downloadUrl!, job.filename)}
                          >
                            Download
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeJob(job.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    {(job.status === 'uploading' || job.status === 'processing') && (
                      <Box sx={{ mb: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {job.status === 'uploading' ? 'Uploading' : 'Processing'}: {job.progress}%
                        </Typography>
                      </Box>
                    )}

                    {/* Error Message */}
                    {job.status === 'error' && job.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {job.error}
                      </Alert>
                    )}

                    {/* Success Message */}
                    {job.status === 'completed' && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Video processing completed! Text has been removed from your video.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Stack>
        </Box>
      )}

      {/* Help Text */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          How it works
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>Upload your video file (MP4, AVI, MOV, etc.)</li>
            <li>Our AI automatically detects and removes text from the video</li>
            <li>Download your processed video with text removed</li>
          </ol>
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> Processing may take several minutes depending on video length and complexity.
          You can check the status in your Ghostcut dashboard as well.
        </Typography>
      </Box>
    </Box>
  );
};

export default VideoInpaintingPage;