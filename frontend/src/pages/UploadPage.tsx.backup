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
  Avatar,
} from '@mui/material';
import {
  CloudUpload,
  VideoFile,
  CheckCircle,
  Speed,
  Security,
  CloudDone,
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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      width: '100%'
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.9) 100%)',
        pt: 8, pb: 6, color: 'white' 
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ 
              fontWeight: 700, 
              mb: 2, 
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Upload Videos for AI Processing
            </Typography>
            <Typography variant="h6" sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 300
            }}>
              Upload one or more videos and we'll automatically remove text, subtitles, and watermarks using advanced AI technology.
            </Typography>
            
            {/* Credits Display - Styled */}
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              px: 3,
              py: 1.5,
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Available Credits: {user?.credits_balance || 100}
              </Typography>
              <Chip
                label="Free Plan"
                sx={{
                  ml: 2,
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 2
                  }
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={9}>
            {/* File Upload Area */}
            {selectedFiles.length === 0 ? (
              <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}>
                <Box
                  {...getRootProps()}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    borderWidth: 3,
                    borderColor: isDragActive ? 'primary.main' : 
                                isDragReject ? 'error.main' : '#e2e8f0',
                    backgroundColor: isDragActive ? 'rgba(102,126,234,0.05)' : 
                                    isDragReject ? 'rgba(239,68,68,0.05)' : 'transparent',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(102,126,234,0.05)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <input {...getInputProps()} />
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto',
                    mb: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}>
                    <CloudUpload sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    color: '#2d3748'
                  }}>
                    {isDragActive
                      ? 'Drop the videos here...'
                      : 'Drag & Drop Videos Here'
                    }
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: '#718096',
                    mb: 4,
                    fontWeight: 400
                  }}>
                    or click to select files from your computer
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CloudUpload />}
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
                    Choose Files
                  </Button>
                  <Typography variant="body2" sx={{ 
                    color: '#a0aec0',
                    mt: 3,
                    fontSize: '0.95rem'
                  }}>
                    Supports MP4, AVI, MOV, MKV, WebM (max 2GB per file)
                  </Typography>
                </Box>
              </Card>
            ) : (
              <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      mr: 2
                    }}>
                      <VideoFile />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                      Selected Videos ({selectedFiles.length})
                    </Typography>
                  </Box>
                  
                  {/* Display all selected files */}
                  <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
                    {selectedFiles.map((file, index) => (
                      <Card key={index} sx={{ 
                        mb: 2, 
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                          <Avatar sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            mr: 2
                          }}>
                            <VideoFile />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, mr: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
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
                            sx={{ 
                              mr: 2, 
                              minWidth: 200,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                              }
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRemoveFile(file)}
                            sx={{ 
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {/* Submit Info */}
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(24,144,255,0.05) 0%, rgba(24,144,255,0.1) 100%)',
                      border: '1px solid rgba(24,144,255,0.2)'
                    }}
                  >
                    <Typography variant="body2">
                      After clicking "Start Processing", you'll be redirected to your job history 
                      where you can monitor the status and download the processed videos when ready.
                      {selectedFiles.length > 1 && ` All ${selectedFiles.length} videos will be processed simultaneously.`}
                    </Typography>
                  </Alert>

                  {/* Error Display */}
                  {uploadError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
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
                    startIcon={<CloudDone />}
                    sx={{
                      background: uploadingCount > 0 ? 
                        'linear-gradient(45deg, #52c41a 30%, #73d13d 90%)' :
                        'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      borderRadius: '25px',
                      py: 2,
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(102,126,234,0.4)'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #a0aec0 30%, #cbd5e0 90%)',
                        color: 'white'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {uploadingCount > 0 
                      ? `Processing... (${uploadedCount}/${uploadingCount})` 
                      : `Start Processing ${selectedFiles.length > 1 ? `${selectedFiles.length} Videos` : 'Video'}`
                    }
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Info Panel */}
          <Grid item xs={12} lg={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* How It Works */}
              <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  p: 2,
                  color: 'white'
                }}>
                  <Avatar sx={{ 
                    background: 'rgba(255,255,255,0.2)',
                    mb: 1,
                    width: 32,
                    height: 32
                  }}>
                    <Speed sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    How It Works
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Professional AI processing in three simple steps
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2 }}>
                  {[
                    'AI automatically detects text in your video',
                    'Advanced inpainting removes text seamlessly',
                    'Download your processed video'
                  ].map((step, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: index < 2 ? 1 : 0 }}>
                      <Avatar sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1.5,
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {index + 1}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: '#2d3748', fontSize: '0.8rem' }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Credit Usage */}
              <Card sx={{
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  p: 2,
                  color: 'white'
                }}>
                  <Avatar sx={{ 
                    background: 'rgba(255,255,255,0.2)',
                    mb: 1,
                    width: 32,
                    height: 32
                  }}>
                    <Security sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Processing Details
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Transparent pricing and timing information
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748' }}>
                    Credit Usage
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                    Processing costs approximately 10 credits per minute of video.
                  </Typography>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748' }}>
                    Processing Time
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                    Professional AI processing takes 3-10 minutes to ensure quality results.
                  </Typography>
                  
                  <Box sx={{
                    background: 'linear-gradient(135deg, rgba(250,112,154,0.1) 0%, rgba(254,225,64,0.1) 100%)',
                    p: 1.5,
                    borderRadius: '8px',
                    border: '1px solid rgba(250,112,154,0.2)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#2d3748', fontWeight: 500, fontSize: '0.75rem' }}>
                      💡 Example: A 3-minute video costs ~30 credits
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={1500}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {selectedFiles.length > 1 
            ? `All ${selectedFiles.length} videos submitted successfully! Redirecting to job history...`
            : 'Video submitted successfully! Redirecting to job history...'
          }
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadPage;