import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { jobsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [uploadError, setUploadError] = useState('');

  // Get processing templates
  const { data: templates = [] } = useQuery({
    queryKey: ['processing-templates'],
    queryFn: jobsApi.getProcessingTemplates,
  });

  // Submit job mutation
  const submitJobMutation = useMutation({
    mutationFn: ({ file, displayName, config }: { file: File; displayName?: string; config?: any }) =>
      jobsApi.submitJob(file, displayName, config),
    onSuccess: (data) => {
      navigate('/jobs');
    },
    onError: (error: any) => {
      setUploadError(error.response?.data?.detail || 'Upload failed');
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setDisplayName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setUploadError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    },
    maxFiles: 1,
    maxSize: 1000 * 1024 * 1024, // 1GB
  });

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const template = templates.find(t => t.id === selectedTemplate);
    const config = template ? template.config : {};

    submitJobMutation.mutate({
      file: selectedFile,
      displayName: displayName || selectedFile.name,
      config,
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDisplayName('');
    setUploadError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const estimateCredits = (file: File) => {
    // Basic estimation - 10 credits per minute
    return getVideoDuration(file).then(duration => Math.ceil(duration / 60) * 10);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Upload Video for Text Removal
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your video and we'll automatically remove text, subtitles, and watermarks using AI.
      </Typography>

      {/* User Credits Display */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>
            Available Credits: <strong>{user?.credits_balance || 0}</strong>
          </Typography>
          <Chip
            label={`${user?.subscription_tier || 'Free'} Plan`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Alert>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* File Upload Area */}
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: isDragActive ? 'primary.main' : 
                          isDragReject ? 'error.main' : 'grey.300',
              backgroundColor: isDragActive ? 'primary.light' : 
                              isDragReject ? 'error.light' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.light',
              },
            }}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <Box>
                <VideoFile sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatFileSize(selectedFile.size)}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  sx={{ mt: 2 }}
                >
                  Remove File
                </Button>
              </Box>
            ) : (
              <Box>
                <CloudUpload sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? 'Drop the video here...'
                    : 'Drag & drop a video, or click to select'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports MP4, AVI, MOV, MKV, WebM (max 1GB)
                </Typography>
              </Box>
            )}
          </Paper>

          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}

          {/* Processing Configuration */}
          {selectedFile && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Configuration
                </Typography>
                
                <TextField
                  fullWidth
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  margin="normal"
                  helperText="Give your processed video a custom name"
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Processing Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    label="Processing Template"
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box>
                          <Typography variant="subtitle2">
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={submitJobMutation.isPending || !selectedFile}
                  sx={{ mt: 3 }}
                >
                  {submitJobMutation.isPending ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    'Start Processing'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Processing Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="primary" sx={{ mr: 2 }} />
                <Typography variant="body2">
                  AI automatically detects text in your video
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="primary" sx={{ mr: 2 }} />
                <Typography variant="body2">
                  Advanced inpainting removes text seamlessly
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle color="primary" sx={{ mr: 2 }} />
                <Typography variant="body2">
                  Download your processed video
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Credit Usage
              </Typography>
              
              <Typography variant="body2" paragraph>
                Processing costs approximately 10 credits per minute of video.
              </Typography>
              
              <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Example: A 3-minute video costs ~30 credits
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supported Formats
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['MP4', 'AVI', 'MOV', 'MKV', 'WebM'].map((format) => (
                  <Chip
                    key={format}
                    label={format}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Maximum file size: 1GB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UploadPage;