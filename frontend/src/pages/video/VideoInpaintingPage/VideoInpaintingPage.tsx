import React from 'react';
import { Box } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { downloadVideo } from './utils/helpers';
import { useVideoProcessing } from './hooks/useVideoProcessing';
import UploadArea from './components/UploadArea';
import JobsList from './components/JobsList';
import HelpSection from './components/HelpSection';

/**
 * Video Inpainting Page
 * Compact page for video text removal
 * Refactored version with modular components and hooks
 */
const VideoInpaintingPage: React.FC = () => {
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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Upload Area */}
      <UploadArea
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isUploading={isUploading}
      />

      {/* Processing Jobs */}
      <JobsList jobs={jobs} onRemoveJob={removeJob} onDownloadVideo={downloadVideo} />

      {/* Help Text */}
      <HelpSection />
    </Box>
  );
};

export default VideoInpaintingPage;
