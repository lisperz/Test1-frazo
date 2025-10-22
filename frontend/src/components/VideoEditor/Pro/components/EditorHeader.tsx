import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

interface Segment {
  id: string;
  label?: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface EditorHeaderProps {
  onBack: () => void;
  segments: Segment[];
  isSubmitting: boolean;
  submissionProgress: string;
  onSubmit: () => Promise<void>;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  onBack,
  segments,
  isSubmitting,
  submissionProgress,
  onSubmit,
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        px: 2,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: '48px'
      }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBack />
        </IconButton>
        <Typography sx={{ fontSize: '14px', color: '#666' }}>
          Pro Video Editor - Multi-Segment Lip Sync
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Show segment count indicator */}
        {segments.length > 0 && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            bgcolor: '#f0f9ff',
            borderRadius: 1,
            border: '1px solid #bae6fd'
          }}>
            <Typography sx={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
              {segments.length} segment{segments.length > 1 ? 's' : ''} configured
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '13px', color: '#999' }}>
          Pro Version
        </Typography>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmitting || segments.length === 0}
          onClick={onSubmit}
          sx={{
            bgcolor: '#1890ff',
            fontSize: '13px',
            px: 3,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#40a9ff'
            },
            '&:disabled': {
              bgcolor: '#d9d9d9',
              color: '#999'
            }
          }}
        >
          {isSubmitting ? 'Processing...' : segments.length === 0 ? 'Add Segments' : 'Submit'}
        </Button>
      </Box>

      {/* Progress indicator for submission */}
      {isSubmitting && submissionProgress && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          gap: 2
        }}>
          <Box sx={{
            width: 16,
            height: 16,
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <Typography sx={{
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            {submissionProgress}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default EditorHeader;
