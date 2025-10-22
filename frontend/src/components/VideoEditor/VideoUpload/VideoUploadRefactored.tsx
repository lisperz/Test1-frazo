import React from 'react';
import { Box, Alert } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useVideoUpload } from './hooks/useVideoUpload';
import UploadingState from './components/UploadingState';
import DropzoneContent from './components/DropzoneContent';
import FileReadyCard from './components/FileReadyCard';

interface VideoUploadProps {
  onUpload: (file: File, url: string) => void;
}

const VideoUploadRefactored: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const {
    uploading,
    uploadProgress,
    error,
    selectedFile,
    localUrl,
    handleFileDrop,
    handleRemoveFile,
    clearError,
  } = useVideoUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'video/*': ['.mp4', '.mpeg', '.mov', '.avi'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleProceed = () => {
    if (selectedFile && localUrl) {
      onUpload(selectedFile, localUrl);
    }
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
            borderColor: isDragActive ? 'primary.main' : uploading ? '#a0aec0' : '#e2e8f0',
            backgroundColor: isDragActive
              ? 'rgba(102,126,234,0.05)'
              : uploading
              ? 'rgba(160,174,192,0.05)'
              : 'transparent',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: uploading ? '#a0aec0' : 'primary.main',
              backgroundColor: uploading
                ? 'rgba(160,174,192,0.05)'
                : 'rgba(102,126,234,0.05)',
              transform: uploading ? 'none' : 'translateY(-2px)',
            },
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <UploadingState uploadProgress={uploadProgress} />
          ) : (
            <DropzoneContent isDragActive={isDragActive} uploading={uploading} />
          )}
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 3,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(239,68,68,0.15)',
          }}
          onClose={clearError}
        >
          {error}
        </Alert>
      )}

      {selectedFile && localUrl && !uploading && (
        <FileReadyCard file={selectedFile} onProceed={handleProceed} onRemove={handleRemoveFile} />
      )}
    </Box>
  );
};

export default VideoUploadRefactored;
