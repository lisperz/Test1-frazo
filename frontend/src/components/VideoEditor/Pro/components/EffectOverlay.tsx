import React from 'react';
import { Rnd } from 'react-rnd';
import { Box, IconButton, Button } from '@mui/material';
import { Close } from '@mui/icons-material';

interface VideoEffect {
  id: string;
  type: 'erasure' | 'protection' | 'text';
  startTime: number;
  endTime: number;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface VideoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EffectOverlayProps {
  effects: VideoEffect[];
  videoBounds: VideoBounds | null;
  currentTime: number;
  editingEffectId: string | null;
  onEffectUpdate: (id: string, region: any) => void;
  onEffectDelete: (id: string) => void;
  onEffectClick: (id: string) => void;
  onStopEditing: () => void;
}

const EffectOverlay: React.FC<EffectOverlayProps> = ({
  effects,
  videoBounds,
  currentTime,
  editingEffectId,
  onEffectUpdate,
  onEffectDelete,
  onEffectClick,
  onStopEditing,
}) => {
  if (!videoBounds) return null;

  const visibleEffects = effects.filter(e =>
    currentTime >= e.startTime && currentTime <= e.endTime
  ).sort((a, b) => {
    const areaA = a.region.width * a.region.height;
    const areaB = b.region.width * b.region.height;
    return areaB - areaA;
  });

  const getEffectColors = (type: VideoEffect['type']) => {
    const colorMap = {
      erasure: { border: '#5B8FF9', bg: 'rgba(91, 143, 249, 0.1)', dot: '#5B8FF9', hover: '#40a9ff' },
      protection: { border: '#5AD8A6', bg: 'rgba(90, 216, 166, 0.1)', dot: '#5AD8A6', hover: '#52c41a' },
      text: { border: '#5D7092', bg: 'rgba(93, 112, 146, 0.1)', dot: '#5D7092', hover: '#434c5e' },
    };
    return colorMap[type];
  };

  const renderCornerDots = (colors: ReturnType<typeof getEffectColors>) => (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
        const positions = {
          tl: { left: -4, top: -4, cursor: 'nw-resize' },
          tr: { right: -4, top: -4, cursor: 'ne-resize' },
          bl: { left: -4, bottom: -4, cursor: 'sw-resize' },
          br: { right: -4, bottom: -4, cursor: 'se-resize' },
        };
        return (
          <Box
            key={pos}
            sx={{
              position: 'absolute',
              ...positions[pos],
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
      })}
    </>
  );

  return (
    <>
      {visibleEffects.map((effect, index) => {
        const isEditing = editingEffectId === effect.id;
        const colors = getEffectColors(effect.type);

        if (isEditing) {
          return (
            <Rnd
              key={effect.id}
              default={{
                x: videoBounds.x + (effect.region.x * videoBounds.width),
                y: videoBounds.y + (effect.region.y * videoBounds.height),
                width: effect.region.width * videoBounds.width,
                height: effect.region.height * videoBounds.height,
              }}
              bounds=".video-bounds-container"
              onDragStop={(e, d) => {
                const newRegion = {
                  x: (d.x - videoBounds.x) / videoBounds.width,
                  y: (d.y - videoBounds.y) / videoBounds.height,
                  width: effect.region.width,
                  height: effect.region.height,
                };
                onEffectUpdate(effect.id, newRegion);
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const newRegion = {
                  x: (position.x - videoBounds.x) / videoBounds.width,
                  y: (position.y - videoBounds.y) / videoBounds.height,
                  width: parseInt(ref.style.width) / videoBounds.width,
                  height: parseInt(ref.style.height) / videoBounds.height,
                };
                onEffectUpdate(effect.id, newRegion);
              }}
              style={{
                border: `2px solid ${colors.border}`,
                backgroundColor: colors.bg,
                position: 'absolute',
                zIndex: 20 - index,
                outline: '2px dashed #fff',
                outlineOffset: '4px',
              }}
            >
              {renderCornerDots(colors)}

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectDelete(effect.id);
                  onStopEditing();
                }}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: -30,
                  transform: 'translateY(-50%)',
                  width: 24,
                  height: 24,
                  bgcolor: '#ff4d4f',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#ff7875',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 20,
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>

              <Box sx={{
                position: 'absolute',
                top: -30,
                left: 0,
                display: 'flex',
                gap: 1,
              }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={onStopEditing}
                  sx={{
                    fontSize: '11px',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    bgcolor: '#52c41a',
                    '&:hover': { bgcolor: '#73d13d' }
                  }}
                >
                  Done
                </Button>
              </Box>
            </Rnd>
          );
        }

        return (
          <Box
            key={effect.id}
            sx={{
              position: 'absolute',
              left: `${videoBounds.x + (effect.region.x * videoBounds.width)}px`,
              top: `${videoBounds.y + (effect.region.y * videoBounds.height)}px`,
              width: `${effect.region.width * videoBounds.width}px`,
              height: `${effect.region.height * videoBounds.height}px`,
              border: `2px solid ${colors.border}`,
              backgroundColor: colors.bg,
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 15 - index,
              '&:hover': {
                opacity: 0.8,
                '& .delete-button': {
                  opacity: 1,
                }
              }
            }}
            onClick={() => onEffectClick(effect.id)}
          >
            <IconButton
              className="delete-button"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEffectDelete(effect.id);
              }}
              sx={{
                position: 'absolute',
                top: '50%',
                right: -30,
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
                bgcolor: '#ff4d4f',
                color: 'white',
                opacity: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#ff7875',
                  transform: 'translateY(-50%) scale(1.1)',
                  opacity: '1 !important',
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 20,
              }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        );
      })}
    </>
  );
};

export default EffectOverlay;
