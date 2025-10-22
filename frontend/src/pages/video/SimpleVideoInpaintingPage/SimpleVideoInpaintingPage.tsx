import React from 'react';
import { Box, Typography, Container, ThemeProvider, CssBaseline } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { theme } from './utils/theme';
import { downloadVideo } from './utils/helpers';
import { useVideoProcessing } from './hooks/useVideoProcessing';
import FeatureHighlights from './components/FeatureHighlights';
import VideoUploadSection from './components/VideoUploadSection';
import ProcessingJobsList from './components/ProcessingJobsList';
import HowItWorks from './components/HowItWorks';

/**
 * Simple Video Inpainting Page
 * Professional page for AI-powered video text removal
 * Refactored version with modular components and hooks
 */
const SimpleVideoInpaintingPage: React.FC = () => {
  const { jobs, isUploading, handleUpload, removeJob } = useVideoProcessing();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          py: 4,
        }}
      >
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
            <FeatureHighlights />
          </Box>

          {/* Upload Area */}
          <VideoUploadSection
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isUploading={isUploading}
          />

          {/* Processing Jobs */}
          <ProcessingJobsList jobs={jobs} onRemoveJob={removeJob} onDownloadVideo={downloadVideo} />

          {/* Instructions */}
          <HowItWorks />
        </Container>
      </Box>

      {/* Add spinning animation for loading icons */}
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
