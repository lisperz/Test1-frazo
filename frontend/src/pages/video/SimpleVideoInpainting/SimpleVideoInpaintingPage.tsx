import React, { useCallback } from 'react';
import { Box, Container, ThemeProvider, CssBaseline } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { redakaTheme } from './theme/redakaTheme';
import { useVideoUpload } from './hooks/useVideoUpload';
import PageHeader from './components/PageHeader';
import UploadArea from './components/UploadArea';
import JobsList from './components/JobsList';
import HowItWorks from './components/HowItWorks';

const SimpleVideoInpaintingPage: React.FC = () => {
  const { jobs, isUploading, uploadVideo, removeJob, downloadVideo } = useVideoUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const videoFile = acceptedFiles[0];
      if (videoFile) {
        await uploadVideo(videoFile);
      }
    },
    [uploadVideo]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    },
    multiple: false,
    disabled: isUploading,
  });

  return (
    <ThemeProvider theme={redakaTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <PageHeader />
          <UploadArea
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isUploading={isUploading}
          />
          <JobsList jobs={jobs} onRemoveJob={removeJob} onDownloadVideo={downloadVideo} />
          <Box sx={{ mt: 6 }}>
            <HowItWorks />
          </Box>
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
