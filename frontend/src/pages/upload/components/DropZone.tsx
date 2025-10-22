import React from 'react';
import { Box, Card, Typography, Avatar, Button } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

interface DropZoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop }) => {
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    },
    multiple: true,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB per file
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone(dropzoneOptions);

  return (
    <Card
      sx={{
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 3,
          borderColor: isDragActive ? 'primary.main' : isDragReject ? 'error.main' : '#e2e8f0',
          backgroundColor: isDragActive ? 'rgba(102,126,234,0.05)' : isDragReject ? 'rgba(239,68,68,0.05)' : 'transparent',
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
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <CloudUpload sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: 2,
            color: '#2d3748',
          }}
        >
          {isDragActive ? 'Drop the videos here...' : 'Drag & Drop Videos Here'}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#718096',
            mb: 4,
            fontWeight: 400,
          }}
        >
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
              boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Choose Files
        </Button>
        <Typography
          variant="body2"
          sx={{
            color: '#a0aec0',
            mt: 3,
            fontSize: '0.95rem',
          }}
        >
          Supports MP4, AVI, MOV, MKV, WebM (max 2GB per file)
        </Typography>
      </Box>
    </Card>
  );
};

export default DropZone;
