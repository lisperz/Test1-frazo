/**
 * Header component for GhostCut Video Editor
 */

import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AUTH_CONFIG } from '../../constants/editorConstants';

interface EditorHeaderProps {
  onBack?: () => void;
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
  isSubmitting: boolean;
  submissionProgress: string;
  onSubmit: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onBack,
  audioFile,
  setAudioFile,
  isSubmitting,
  submissionProgress,
  onSubmit,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          px: 2,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          minHeight: '48px',
        }}
      >
        <IconButton onClick={onBack || (() => navigate(-1))} size="small">
          <ArrowBack />
        </IconButton>
        <Typography sx={{ fontSize: '14px', color: '#666' }}>
          Video Erasure
        </Typography>

        {/* Audio Upload Box */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mx: 2,
            p: 1,
            bgcolor: '#f8f9fa',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <Typography sx={{ fontSize: '12px', color: '#666', mr: 1 }}>
            Lip Sync:
          </Typography>
          <input
            type="file"
            accept="audio/*"
            id="audio-upload"
            style={{ display: 'none' }}
            onChange={(e) => {
              console.log('Audio input changed, files:', e.target.files);
              const file = e.target.files?.[0];
              if (file) {
                console.log('Audio file selected:', file.name, 'Type:', file.type, 'Size:', file.size);
                setAudioFile(file);
              } else {
                console.log('No audio file selected');
              }
            }}
          />
          <label htmlFor="audio-upload">
            <Button
              component="span"
              variant="outlined"
              size="small"
              sx={{
                fontSize: '11px',
                textTransform: 'none',
                minWidth: '80px',
                height: '28px',
                borderColor: audioFile ? '#52c41a' : '#d9d9d9',
                color: audioFile ? '#52c41a' : '#666',
                bgcolor: audioFile ? '#f6ffed' : 'white',
              }}
            >
              {audioFile ? 'Audio Ready' : 'Upload Audio'}
            </Button>
          </label>
          {audioFile && (
            <Typography sx={{ fontSize: '10px', color: '#52c41a', ml: 1 }}>
              {audioFile.name.slice(0, 15)}...
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '13px', color: '#999' }}>
          Basic Version
        </Typography>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmitting}
          onClick={onSubmit}
          sx={{
            bgcolor: '#1890ff',
            fontSize: '13px',
            px: 3,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#40a9ff',
            },
          }}
        >
          {isSubmitting ? 'Processing...' : 'Submit'}
        </Button>
      </Box>

      {/* Progress indicator for submission */}
      {isSubmitting && submissionProgress && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #1890ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: '14px',
              color: '#666',
              fontStyle: 'italic',
            }}
          >
            {submissionProgress}
          </Typography>
        </Box>
      )}
    </>
  );
};
