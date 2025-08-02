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
  Chip,
  IconButton,
  Stack,
  Fade,
  Container,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  Download,
  CheckCircle,
  Error,
  Refresh,
  Delete,
  AutoFixHigh,
  Speed,
  Security,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// Create Redaka-style theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

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

const SimpleVideoInpaintingPage: React.FC = () => {
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
                taskId: response.data.task_id || response.data.processing_result?.task_id,
              }
            : job
        )
      );

      // Start polling for status if we have a task ID
      const taskId = response.data.task_id || response.data.processing_result?.task_id;
      if (taskId) {
        pollJobStatus(jobId, taskId);
      }
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

        if (statusData && statusData.job_status) {
          const jobStatus = statusData.job_status;
          
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
            const progress = jobStatus.progress || Math.min(attempts * 2, 95);
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
        return <Refresh sx={{ animation: 'spin 2s linear infinite' }} />;
      case 'completed':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      default:
        return <VideoFile />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default',
        py: 4,
      }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Video Text Inpainting
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 400 }}>
              Remove text from videos automatically using AI
            </Typography>
            
            {/* Feature highlights */}
            <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <AutoFixHigh color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>AI-Powered</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatic text detection and removal
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>Fast Processing</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quick turnaround for most videos
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>Secure</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your videos are processed securely
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Upload Area */}
          <Paper
            {...getRootProps()}
            sx={{
              p: 6,
              mb: 4,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
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
              }}
            >
              <CloudUpload
                sx={{
                  fontSize: 80,
                  color: 'primary.main',
                  mb: 3,
                }}
              />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {isDragActive
                  ? 'Drop your video here'
                  : 'Upload Video'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                Drag your video here, or click to browse. Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM
              </Typography>
              <Button
                variant="contained"
                size="large"
                disabled={isUploading}
                startIcon={<CloudUpload />}
                sx={{ px: 4, py: 1.5 }}
              >
                {isUploading ? 'Uploading...' : 'Choose Video File'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                Maximum file size: 100MB
              </Typography>
            </Box>
          </Paper>

          {/* Processing Jobs */}
          {jobs.length > 0 && (
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Processing Status
              </Typography>
              <Stack spacing={3}>
                {jobs.map((job) => (
                  <Fade in key={job.id}>
                    <Card>
                      <CardContent sx={{ p: 3 }}>
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
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {job.filename}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {job.fileSize} {job.taskId && `• Task ID: ${job.taskId}`}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip
                              label={job.status.replace('_', ' ').toUpperCase()}
                              color={getStatusColor(job.status)}
                              variant="outlined"
                            />
                            {job.status === 'completed' && job.downloadUrl && (
                              <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => downloadVideo(job.downloadUrl!, job.filename)}
                                sx={{ px: 3 }}
                              >
                                Download
                              </Button>
                            )}
                            <IconButton
                              onClick={() => removeJob(job.id)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Progress Bar */}
                        {(job.status === 'uploading' || job.status === 'processing') && (
                          <Box sx={{ mb: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={job.progress}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: 'grey.200',
                              }}
                            />
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {job.status === 'uploading' ? 'Uploading' : 'Processing'}: {job.progress}%
                            </Typography>
                          </Box>
                        )}

                        {/* Error Message */}
                        {job.status === 'error' && job.error && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {job.error}
                          </Alert>
                        )}

                        {/* Success Message */}
                        {job.status === 'completed' && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            🎉 Video processing completed! Text has been successfully removed from your video.
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Stack>
            </Box>
          )}

          {/* Instructions */}
          <Box sx={{ mt: 6 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  How it works
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        fontSize: 24,
                        fontWeight: 'bold'
                      }}>
                        1
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Upload Video
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select your video file with text you want to remove
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        fontSize: 24,
                        fontWeight: 'bold'
                      }}>
                        2
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        AI Processing
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Our AI automatically detects and removes text from your video
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        fontSize: 24,
                        fontWeight: 'bold'
                      }}>
                        3
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Download Result
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Download your clean video with text removed
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
      
      {/* Add spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </ThemeProvider>
  );
};

export default SimpleVideoInpaintingPage;