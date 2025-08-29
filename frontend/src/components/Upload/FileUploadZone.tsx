import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Description,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: Record<string, string[]>;
  maxFileSize?: number;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  supportedFormats?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  acceptedFileTypes = {
    'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
  },
  maxFileSize = 104857600, // 100MB in bytes
  disabled = false,
  title = 'Upload Video',
  subtitle = 'Drag video here, or click to browse',
  supportedFormats = 'VIDEO/MP4, VIDEO/AVI, VIDEO/MOV, VIDEO/WMV, VIDEO/WEBM (Max 100MB)',
}) => {
  const theme = useTheme();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file size
      if (file.size > maxFileSize) {
        alert(`File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
    maxSize: maxFileSize,
    disabled,
    multiple: false,
  });

  // Handle file rejection feedback
  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const error = rejection.errors[0];
      
      if (error.code === 'file-too-large') {
        alert(`File is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      } else if (error.code === 'file-invalid-type') {
        alert('Invalid file type. Please upload a supported format.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  }, [fileRejections, maxFileSize]);

  return (
    <Paper
      {...getRootProps()}
      elevation={0}
      sx={{
        border: `2px dashed ${theme.palette.divider}`,
        borderRadius: 3,
        p: 6,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive 
          ? alpha(theme.palette.primary.main, 0.05)
          : 'transparent',
        borderColor: isDragActive 
          ? theme.palette.primary.main 
          : theme.palette.divider,
        transition: 'all 0.2s ease-in-out',
        '&:hover': !disabled ? {
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        } : {},
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input {...getInputProps()} />
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Upload Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-in-out',
            transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <CloudUpload 
            sx={{ 
              fontSize: 32, 
              color: 'primary.main',
            }} 
          />
        </Box>

        {/* Title */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: isDragActive ? 'primary.main' : 'text.primary',
          }}
        >
          {title}
        </Typography>

        {/* Upload Button */}
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          disabled={disabled}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 500,
            backgroundColor: theme.palette.mode === 'dark' ? '#374151' : '#1f2937',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#4b5563' : '#111827',
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = Object.keys(acceptedFileTypes).join(',');
            input.onchange = (event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (file) {
                onFileSelect(file);
              }
            };
            input.click();
          }}
        >
          Upload Video
        </Button>

        {/* Subtitle */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            maxWidth: 400,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>

        {/* Supported formats */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            fontSize: 11,
            opacity: 0.8,
          }}
        >
          Supported formats: {supportedFormats}
        </Typography>
      </Box>
    </Paper>
  );
};

export default FileUploadZone;