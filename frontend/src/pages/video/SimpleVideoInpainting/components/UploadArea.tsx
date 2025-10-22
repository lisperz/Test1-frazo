import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';

interface UploadAreaProps {
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
  isUploading: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
}) => {
  return (
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
          {isDragActive ? 'Drop your video here' : 'Upload Video'}
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
  );
};

export default UploadArea;
