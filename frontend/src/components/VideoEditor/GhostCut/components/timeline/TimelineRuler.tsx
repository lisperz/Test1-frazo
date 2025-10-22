/**
 * Timeline ruler with time marks and current time indicator
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { calculateProgressPercentage } from '../../../../../utils/timelineUtils';
import { formatTime } from '../../utils/formatUtils';
import { TIMELINE_CONFIG } from '../../constants/editorConstants';

interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  timelineZoom: number;
  isVideoReady: boolean;
  isDraggingTimeline: boolean;
  onSeek: (time: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  currentTime,
  timelineZoom,
  isVideoReady,
  isDraggingTimeline,
  onSeek,
  onDragStart,
}) => {
  const progressPercentage = calculateProgressPercentage(currentTime, duration);

  return (
    <Box
      data-timeline-ruler
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const newTime = (percentage / 100) * duration;
        onSeek(newTime);
      }}
      sx={{
        height: 40,
        bgcolor: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        minWidth: `${100 * timelineZoom}%`,
        width: `${100 * timelineZoom}%`,
      }}
    >
      {/* Background gradient */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
          pointerEvents: 'none',
        }}
      />

      {/* Time marks */}
      {Array.from({ length: Math.min(TIMELINE_CONFIG.TIME_MARK_COUNT, Math.ceil(duration) + 1) }, (_, i) => {
        const markTime = (i / 10) * duration;
        const markPercentage = calculateProgressPercentage(markTime, duration);
        const isMainMark = i % 2 === 0;
        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: `${markPercentage}%`,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            {isMainMark && (
              <Typography
                sx={{
                  position: 'absolute',
                  top: '2px',
                  fontSize: '10px',
                  color: '#666',
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                {formatTime(markTime, true)}
              </Typography>
            )}
            <Box
              sx={{
                width: '1px',
                height: isMainMark ? '12px' : '8px',
                bgcolor: isMainMark ? '#999' : '#ccc',
                position: 'absolute',
                bottom: 0,
              }}
            />
          </Box>
        );
      })}

      {/* Current time indicator */}
      {isVideoReady && duration > 0 && (
        <>
          <Box
            sx={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              bgcolor: '#ff4d4f',
              zIndex: 20,
              pointerEvents: 'none',
              boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)',
            }}
          />

          {/* Draggable handle */}
          <Box
            onMouseDown={onDragStart}
            sx={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: -3,
              width: '8px',
              height: '46px',
              bgcolor: isDraggingTimeline ? 'rgba(255, 77, 79, 0.2)' : 'transparent',
              cursor: 'ew-resize',
              zIndex: 21,
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
                  height: '20px',
                  bgcolor: '#ff4d4f',
                  borderRadius: '1px',
                  boxShadow: '0 0 4px rgba(255, 77, 79, 0.8)',
                },
              },
            }}
          />

          {/* Current time display */}
          <Box
            sx={{
              position: 'absolute',
              left: `${progressPercentage}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: '#ff4d4f',
              color: 'white',
              px: 1,
              py: 0.25,
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              zIndex: 21,
              pointerEvents: 'none',
              opacity: progressPercentage > 5 && progressPercentage < 95 ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            {formatTime(currentTime, true)}
          </Box>
        </>
      )}
    </Box>
  );
};
