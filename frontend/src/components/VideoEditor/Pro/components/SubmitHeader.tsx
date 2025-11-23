/**
 * Submit Header Component
 *
 * Header section for Pro Video Editor with:
 * - Back navigation
 * - Segment count indicator
 * - Submit button
 * - Progress indicator during submission
 */

import React from 'react';
import { Box, Typography, Button, IconButton, Chip } from '@mui/material';
import { ArrowBack, Warning } from '@mui/icons-material';
import { NavigateFunction } from 'react-router-dom';
import { VideoSegment } from '../../../../types/segments';
import { detectOverlappingSegments } from '../../../../utils/segmentOverlapDetection';

interface SubmitHeaderProps {
  segments: VideoSegment[];
  isSubmitting: boolean;
  submissionProgress: string;
  handleSubmit: () => Promise<void>;
  onBack?: () => void;
  navigate: NavigateFunction;
}

export const SubmitHeader: React.FC<SubmitHeaderProps> = ({
  segments,
  isSubmitting,
  submissionProgress,
  handleSubmit,
  onBack,
  navigate,
}) => {
  // Detect overlapping segments
  const overlaps = React.useMemo(() => {
    return detectOverlappingSegments(segments);
  }, [segments]);

  const hasOverlaps = overlaps.length > 0;

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
        <IconButton onClick={onBack || (() => navigate(-1))} size="small">
          <ArrowBack />
        </IconButton>
        <Typography sx={{ fontSize: '14px', color: '#666' }}>
          Pro Video Editor - Multi-Segment Lip Sync
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Show overlap warning if detected */}
        {hasOverlaps && (
          <Chip
            icon={<Warning sx={{ fontSize: 16 }} />}
            label={`${overlaps.length} overlap${overlaps.length > 1 ? 's' : ''} detected`}
            size="small"
            sx={{
              bgcolor: '#fff7e6',
              color: '#d46b08',
              border: '1px solid #ffd591',
              fontWeight: 600,
              fontSize: '11px',
              '& .MuiChip-icon': {
                color: '#d46b08',
              }
            }}
          />
        )}

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
          onClick={handleSubmit}
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
