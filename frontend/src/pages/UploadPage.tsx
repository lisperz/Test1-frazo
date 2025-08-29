import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  CheckCircle,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { jobsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [displayNames, setDisplayNames] = useState<{[key: string]: string}>({});
  const [uploadError, setUploadError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Process all selected files
  const processAllFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploadError('');
    setUploadingCount(selectedFiles.length);
    setUploadedCount(0);
    
    // Process each file
    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        const response = await jobsApi.uploadAndProcess(
          file, 
          displayNames[file.name] || file.name.replace(/\.[^/.]+$/, '')
        );
        setUploadedCount(prev => prev + 1);
        return response;
      } catch (error: any) {
        console.error(`Upload error for ${file.name}:`, error);
        return null;
      }
    });
    
    // Wait for all uploads to complete
    await Promise.all(uploadPromises);
    
    // Show success and redirect
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/history');
    }, 1500);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFiles(acceptedFiles);
      // Set default display names for each file
      const newDisplayNames: {[key: string]: string} = {};
      acceptedFiles.forEach(file => {
        newDisplayNames[file.name] = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      });
      setDisplayNames(newDisplayNames);
      setUploadError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    },
    multiple: true, // Allow multiple files
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB per file
  });

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    await processAllFiles();
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove));
    setDisplayNames(prev => {
      const newNames = {...prev};
      delete newNames[fileToRemove.name];
      return newNames;
    });
    if (selectedFiles.length === 1) {
      setUploadError('');
    }
  };
  
  const handleDisplayNameChange = (fileName: string, newName: string) => {
    setDisplayNames(prev => ({...prev, [fileName]: newName}));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Upload Videos for Text Removal
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload one or more videos and we'll automatically remove text, subtitles, and watermarks using AI.
      </Typography>

      {/* User Credits Display */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>
            Available Credits: <strong>{user?.credits_balance || 100}</strong>
          </Typography>
          <Chip
            label="free Plan"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Alert>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* File Upload Area */}
          {selectedFiles.length === 0 ? (
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
                backgroundColor: isDragActive ? 'action.hover' : 
                                isDragReject ? 'error.light' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <input {...getInputProps()} />
              <Box>
                <CloudUpload sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? 'Drop the videos here...'
                    : 'Drag & drop videos, or click to select'
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports MP4, AVI, MOV, MKV, WebM (max 2GB)
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                Selected Videos ({selectedFiles.length})
              </Typography>
              
              {/* Display all selected files */}
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3 }}>
                {selectedFiles.map((file, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                      <VideoFile sx={{ color: 'primary.main', mr: 2 }} />
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <Typography variant="subtitle2">
                          {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                      <TextField
                        size="small"
                        label="Display Name"
                        value={displayNames[file.name] || ''}
                        onChange={(e) => handleDisplayNameChange(file.name, e.target.value)}
                        sx={{ mr: 2, minWidth: 200 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRemoveFile(file)}
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>

                {/* Submit Info */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    After clicking "Start Processing All", you'll be redirected to your job history 
                    where you can monitor the status and download the processed videos when ready.
                    {selectedFiles.length > 1 && ` All ${selectedFiles.length} videos will be processed simultaneously.`}
                  </Typography>
                </Alert>

                {/* Error Display */}
                {uploadError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {uploadError}
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={selectedFiles.length === 0 || uploadingCount > 0}
                  startIcon={<CloudUpload />}
                >
                  {uploadingCount > 0 
                    ? `Submitting... (${uploadedCount}/${uploadingCount})` 
                    : `Start Processing ${selectedFiles.length > 1 ? `All ${selectedFiles.length} Videos` : ''}`
                  }
                </Button>
            </Paper>
          )}
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    AI automatically detects text in your video
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Advanced inpainting removes text seamlessly
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Download your processed video
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Credit Usage
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Processing costs approximately 10 credits per minute of video.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Processing Time
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Professional AI processing takes time to ensure quality results. 
                Typical processing time is 3-10 minutes.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Example: A 3-minute video costs ~30 credits
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supported Formats
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['MP4', 'AVI', 'MOV', 'MKV', 'WebM'].map((format) => (
                  <Chip key={format} label={format} size="small" />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Maximum file size: 2GB
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={1500}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {selectedFiles.length > 1 
            ? `All ${selectedFiles.length} videos submitted successfully! Redirecting to job history...`
            : 'Video submitted successfully! Redirecting to job history...'
          }
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UploadPage;