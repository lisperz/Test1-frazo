import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { VideoFile, CloudUpload } from '@mui/icons-material';

interface DropzoneContentProps {
  isDragActive: boolean;
  uploading: boolean;
}

const DropzoneContent: React.FC<DropzoneContentProps> = ({ isDragActive, uploading }) => {
  return (
    <Box>
      <Avatar
        sx={{
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <VideoFile sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#2d3748' }}>
        {isDragActive ? 'Drop the video here...' : 'Drag & Drop Video Here'}
      </Typography>
      <Typography variant="h6" sx={{ color: '#718096', mb: 4, fontWeight: 400 }}>
        or click to select a video file from your computer
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<CloudUpload />}
        disabled={uploading}
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
            boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        Browse Files
      </Button>
      <Typography variant="body2" sx={{ color: '#a0aec0', mt: 3, fontSize: '0.95rem' }}>
        Supported formats: MP4, MPEG, MOV, AVI (Max 2GB)
      </Typography>
    </Box>
  );
};

export default DropzoneContent;
