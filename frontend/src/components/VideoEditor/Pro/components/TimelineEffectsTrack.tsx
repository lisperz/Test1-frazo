import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

interface TimelineEffect {
  id: string;
  type: 'erasure' | 'protection' | 'text';
  startFrame: number;
  endFrame: number;
  color: string;
  label: string;
}

interface TimelineEffectsTrackProps {
  timelineEffects: TimelineEffect[];
  duration: number;
  currentTime: number;
  progressPercentage: number;
  editingEffectId: string | null;
  formatTime: (seconds: number, includeMs?: boolean) => string;
  onEffectDrag: (e: React.MouseEvent, effectId: string, type: 'start' | 'end' | 'move') => void;
  onEffectClick: (effectId: string, e: React.MouseEvent) => void;
  onEffectDelete: (id: string) => void;
}

const TimelineEffectsTrack: React.FC<TimelineEffectsTrackProps> = ({
  timelineEffects,
  duration,
  currentTime,
  progressPercentage,
  editingEffectId,
  formatTime,
  onEffectDrag,
  onEffectClick,
  onEffectDelete,
}) => {
  return (
    <Box sx={{
      position: 'relative',
      flex: 1,
      minHeight: 200,
      maxHeight: 300,
      bgcolor: 'white',
      borderRadius: '6px',
      border: '1px solid #d9d9d9',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      {/* Timeline Indicator */}
      {duration > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: `${progressPercentage}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            bgcolor: '#ff4d4f',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)',
            transform: 'translateX(-1px)',
          }}
        />
      )}

      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1.5,
        pb: 1,
        borderBottom: '1px solid #e9ecef'
      }}>
        <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
          Effect Track
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#999' }}>
          Current Effects ({timelineEffects.length})
        </Typography>
      </Box>

      {/* Effect Bars */}
      <Box sx={{
        position: 'relative',
        flex: 1,
        minHeight: '150px',
        maxHeight: '220px',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f5f5f5',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#d9d9d9',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: '#bfbfbf',
          },
        },
      }}>
        <Box sx={{
          position: 'relative',
          height: `${Math.max(50, timelineEffects.length * 40)}px`,
          width: '100%'
        }}>
          {timelineEffects.map((effect, index) => {
            const trackTop = index * 40 + 5;
            const effectLeft = effect.startFrame;
            const effectWidth = effect.endFrame - effect.startFrame;

            return (
              <Box
                key={effect.id}
                sx={{
                  position: 'absolute',
                  left: `${effectLeft}%`,
                  width: `${effectWidth}%`,
                  top: `${trackTop}px`,
                  height: '30px',
                  bgcolor: effect.color,
                  borderRadius: '4px',
                  cursor: 'move',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  opacity: editingEffectId === effect.id ? 1 : 0.85,
                  zIndex: 15,
                  border: editingEffectId === effect.id ? '2px solid #1890ff' : '1px solid rgba(255,255,255,0.3)',
                  boxShadow: editingEffectId === effect.id ? '0 2px 8px rgba(24,144,255,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    '& [data-drag-handle="true"]': {
                      opacity: 1
                    }
                  }
                }}
                onMouseDown={(e) => onEffectDrag(e, effect.id, 'move')}
                onClick={(e) => onEffectClick(effect.id, e)}
              >
                {/* Start Handle */}
                <Box
                  data-drag-handle="true"
                  sx={{
                    position: 'absolute',
                    left: -2,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    cursor: 'ew-resize',
                    borderRadius: '2px 0 0 2px',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                      opacity: 1,
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onEffectDrag(e, effect.id, 'start');
                  }}
                />

                {/* Label with time range */}
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Typography sx={{
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 600,
                    userSelect: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {effect.label}
                  </Typography>
                  <Typography sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '8px',
                    fontFamily: 'monospace',
                    userSelect: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {(() => {
                      const startTime = (effect.startFrame / 100) * duration;
                      const endTime = (effect.endFrame / 100) * duration;
                      return `${formatTime(startTime, true)} - ${formatTime(endTime, true)}`;
                    })()}
                  </Typography>
                </Box>

                {/* Delete Button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEffectDelete(effect.id);
                  }}
                  sx={{
                    p: 0.25,
                    color: 'rgba(255,255,255,0.9)',
                    opacity: 0.8,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      opacity: 1,
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Delete sx={{ fontSize: 12 }} />
                </IconButton>

                {/* End Handle */}
                <Box
                  data-drag-handle="true"
                  sx={{
                    position: 'absolute',
                    right: -2,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    bgcolor: 'rgba(255,255,255,0.8)',
                    cursor: 'ew-resize',
                    borderRadius: '0 2px 2px 0',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                      opacity: 1,
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onEffectDrag(e, effect.id, 'end');
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default TimelineEffectsTrack;
