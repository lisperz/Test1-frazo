import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface UploadAreaProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  isUploading: boolean;
}

/**
 * Upload area component for video files
 * Compact version with drag-and-drop support
 */
const UploadArea: React.FC<UploadAreaProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Video Text Inpainting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your video and remove text automatically using AI
        </Typography>
        <Chip label="5 credits" color="primary" size="small" sx={{ mt: 1 }} />
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
            {isDragActive ? 'Drop your video here' : 'Drag video here, or click to browse'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supported formats: MP4, AVI, MOV, WMV, FLV, WEBM (Max 100MB)
          </Typography>
          <Button variant="contained" disabled={isUploading} startIcon={<CloudUpload />}>
            Upload Video
          </Button>
        </Box>
      </Paper>
    </>
  );
};

export default UploadArea;
