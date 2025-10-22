/**
 * Drawing overlay for new effects
 */

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Rnd } from 'react-rnd';
import { VideoBounds, RectRegion, EffectType } from '../../types';
import { EFFECT_COLORS, EFFECT_BG_COLORS } from '../../constants/editorConstants';
import { formatTime } from '../../utils/formatUtils';
import { CornerDots } from './CornerDots';

interface DrawingOverlayProps {
  videoBounds: VideoBounds;
  currentRect: RectRegion;
  setCurrentRect: (rect: RectRegion) => void;
  selectedType: EffectType;
  currentTime: number;
  duration: number;
  onSaveRect: () => void;
  onCancelDrawing: () => void;
}

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({
  videoBounds,
  currentRect,
  setCurrentRect,
  selectedType,
  currentTime,
  duration,
  onSaveRect,
  onCancelDrawing,
}) => {
  return (
    <Rnd
      default={{
        x: videoBounds.x + currentRect.x * videoBounds.width,
        y: videoBounds.y + currentRect.y * videoBounds.height,
        width: currentRect.width * videoBounds.width,
        height: currentRect.height * videoBounds.height,
      }}
      bounds=".video-bounds-container"
      onDragStop={(e, d) => {
        setCurrentRect({
          x: (d.x - videoBounds.x) / videoBounds.width,
          y: (d.y - videoBounds.y) / videoBounds.height,
          width: currentRect.width,
          height: currentRect.height,
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setCurrentRect({
          x: (position.x - videoBounds.x) / videoBounds.width,
          y: (position.y - videoBounds.y) / videoBounds.height,
          width: parseInt(ref.style.width) / videoBounds.width,
          height: parseInt(ref.style.height) / videoBounds.height,
        });
      }}
      style={{
        border: `3px solid ${EFFECT_COLORS[selectedType]}`,
        backgroundColor: EFFECT_BG_COLORS[selectedType],
        position: 'absolute',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      <CornerDots type={selectedType} />
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: '10px',
            color: '#fff',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            px: 1,
            py: 0.5,
            borderRadius: '3px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTime(currentTime, true)} - {formatTime(Math.min(currentTime + 5, duration), true)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onSaveRect}
            sx={{
              fontSize: '11px',
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              bgcolor: '#52c41a',
              '&:hover': { bgcolor: '#73d13d' },
            }}
          >
            Confirm
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={onCancelDrawing}
            sx={{
              fontSize: '11px',
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              borderColor: '#ff4d4f',
              color: '#ff4d4f',
              '&:hover': {
                borderColor: '#ff7875',
                color: '#ff7875',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Rnd>
  );
};
