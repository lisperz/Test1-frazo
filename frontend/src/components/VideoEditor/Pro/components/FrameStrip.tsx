import React from 'react';
import { Box } from '@mui/material';

interface FrameStripProps {
  thumbnails: string[];
  duration: number;
  currentTime: number;
  progressPercentage: number;
  timelineZoom: number;
  isDragging: boolean;
  frameStripRef: React.RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const FrameStrip: React.FC<FrameStripProps> = ({
  thumbnails,
  duration,
  currentTime,
  progressPercentage,
  timelineZoom,
  isDragging,
  frameStripRef,
  onSeek,
  onDragStart,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if dragging
    if (isDragging) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    onSeek(newTime);
  };

  return (
    <Box
      ref={frameStripRef}
      data-frame-strip
      onClick={handleClick}
      sx={{
        height: 80,
        bgcolor: 'white',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        position: 'relative',
        border: '1px solid #d9d9d9',
        mb: 1,
        minWidth: `${100 * timelineZoom}%`,
        width: `${100 * timelineZoom}%`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    >
      {/* Thumbnail Images */}
      {thumbnails.map((thumb, index) => (
        <Box
          key={index}
          sx={{
            height: '100%',
            width: `${100 / thumbnails.length}%`,
            position: 'relative',
            borderRight: index < thumbnails.length - 1 ? '1px solid #e9ecef' : 'none'
          }}
        >
          <Box
            component="img"
            src={thumb}
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </Box>
      ))}

      {/* Current Time Indicator */}
      {duration > 0 && (
        <>
          <Box
            sx={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              bgcolor: '#ff4d4f',
              zIndex: 30,
              pointerEvents: 'none',
              boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)'
            }}
          />

          {/* Draggable handle */}
          <Box
            onMouseDown={onDragStart}
            sx={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: -5,
              width: '8px',
              height: '90px',
              bgcolor: isDragging ? 'rgba(255, 77, 79, 0.2)' : 'transparent',
              cursor: 'ew-resize',
              zIndex: 31,
              transform: 'translateX(-4px)',
              borderRadius: '2px',
              '&:hover': {
                bgcolor: 'rgba(255, 77, 79, 0.15)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '3px',
                  height: '40px',
                  bgcolor: '#ff4d4f',
                  borderRadius: '1px',
                  boxShadow: '0 0 4px rgba(255, 77, 79, 0.8)'
                }
              }
            }}
          />
        </>
      )}
    </Box>
  );
};

export default FrameStrip;
