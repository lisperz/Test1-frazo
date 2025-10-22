import React from 'react';
import { Rnd } from 'react-rnd';
import { Box, Typography, Button } from '@mui/material';

interface VideoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CurrentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingRectangleProps {
  isDrawingMode: boolean;
  currentRect: CurrentRect | null;
  selectedType: 'erasure' | 'protection' | 'text';
  videoBounds: VideoBounds | null;
  currentTime: number;
  duration: number;
  formatTime: (seconds: number, includeMs?: boolean) => string;
  onRectUpdate: (rect: CurrentRect) => void;
  onSave: () => void;
  onCancel: () => void;
}

const DrawingRectangle: React.FC<DrawingRectangleProps> = ({
  isDrawingMode,
  currentRect,
  selectedType,
  videoBounds,
  currentTime,
  duration,
  formatTime,
  onRectUpdate,
  onSave,
  onCancel,
}) => {
  if (!isDrawingMode || !currentRect || !videoBounds) {
    return null;
  }

  const typeColors = {
    erasure: { border: '#5B8FF9', bg: 'rgba(91, 143, 249, 0.15)', dot: '#5B8FF9', hover: '#40a9ff' },
    protection: { border: '#5AD8A6', bg: 'rgba(90, 216, 166, 0.15)', dot: '#5AD8A6', hover: '#52c41a' },
    text: { border: '#5D7092', bg: 'rgba(93, 112, 146, 0.15)', dot: '#5D7092', hover: '#434c5e' },
  };

  const colors = typeColors[selectedType];

  const renderCornerDot = (position: 'tl' | 'tr' | 'bl' | 'br') => {
    const positionStyles = {
      tl: { left: -4, top: -4, cursor: 'nw-resize' },
      tr: { right: -4, top: -4, cursor: 'ne-resize' },
      bl: { left: -4, bottom: -4, cursor: 'sw-resize' },
      br: { right: -4, bottom: -4, cursor: 'se-resize' },
    };

    return (
      <Box
        sx={{
          position: 'absolute',
          ...positionStyles[position],
          width: 8,
          height: 8,
          backgroundColor: colors.dot,
          border: '2px solid white',
          borderRadius: '50%',
          pointerEvents: 'auto',
          '&:hover': {
            backgroundColor: colors.hover,
            transform: 'scale(1.2)',
          }
        }}
      />
    );
  };

  return (
    <Rnd
      default={{
        x: videoBounds.x + (currentRect.x * videoBounds.width),
        y: videoBounds.y + (currentRect.y * videoBounds.height),
        width: currentRect.width * videoBounds.width,
        height: currentRect.height * videoBounds.height,
      }}
      bounds=".video-bounds-container"
      onDragStop={(e, d) => {
        onRectUpdate({
          x: (d.x - videoBounds.x) / videoBounds.width,
          y: (d.y - videoBounds.y) / videoBounds.height,
          width: currentRect.width,
          height: currentRect.height,
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onRectUpdate({
          x: (position.x - videoBounds.x) / videoBounds.width,
          y: (position.y - videoBounds.y) / videoBounds.height,
          width: parseInt(ref.style.width) / videoBounds.width,
          height: parseInt(ref.style.height) / videoBounds.height,
        });
      }}
      style={{
        border: `3px solid ${colors.border}`,
        backgroundColor: colors.bg,
        position: 'absolute',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
      }}
    >
      {renderCornerDot('tl')}
      {renderCornerDot('tr')}
      {renderCornerDot('bl')}
      {renderCornerDot('br')}

      <Box sx={{
        position: 'absolute',
        top: -50,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}>
        <Typography sx={{
          fontSize: '10px',
          color: '#fff',
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          px: 1,
          py: 0.5,
          borderRadius: '3px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap'
        }}>
          {formatTime(currentTime, true)} - {formatTime(Math.min(currentTime + 5, duration), true)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={onSave}
            sx={{
              fontSize: '11px',
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              bgcolor: '#52c41a',
              '&:hover': { bgcolor: '#73d13d' }
            }}
          >
            Confirm
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={onCancel}
            sx={{
              fontSize: '11px',
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              borderColor: '#ff4d4f',
              color: '#ff4d4f',
              '&:hover': {
                borderColor: '#ff7875',
                color: '#ff7875'
              }
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Rnd>
  );
};

export default DrawingRectangle;
