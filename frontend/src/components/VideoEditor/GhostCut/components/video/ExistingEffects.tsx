/**
 * Existing effects display and editing
 */

import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Rnd } from 'react-rnd';
import { VideoEffect } from '../../../../../store/effectsStore';
import { VideoBounds } from '../../types';
import { EFFECT_COLORS, EFFECT_BG_COLORS } from '../../constants/editorConstants';
import { CornerDots } from './CornerDots';

interface ExistingEffectsProps {
  videoBounds: VideoBounds;
  effects: VideoEffect[];
  currentTime: number;
  editingEffectId: string | null;
  onUpdateEffect: (id: string, updates: Partial<VideoEffect>) => void;
  onDeleteEffect: (id: string) => void;
  onSetEditingEffect: (id: string | null) => void;
}

export const ExistingEffects: React.FC<ExistingEffectsProps> = ({
  videoBounds,
  effects,
  currentTime,
  editingEffectId,
  onUpdateEffect,
  onDeleteEffect,
  onSetEditingEffect,
}) => {
  const visibleEffects = effects
    .filter((e) => currentTime >= e.startTime && currentTime <= e.endTime)
    .sort((a, b) => {
      const areaA = a.region.width * a.region.height;
      const areaB = b.region.width * b.region.height;
      return areaB - areaA;
    });

  return (
    <>
      {visibleEffects.map((effect, index) => {
        const isEditing = editingEffectId === effect.id;

        if (isEditing) {
          return (
            <Rnd
              key={effect.id}
              default={{
                x: videoBounds.x + effect.region.x * videoBounds.width,
                y: videoBounds.y + effect.region.y * videoBounds.height,
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
                onUpdateEffect(effect.id, { region: newRegion });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const newRegion = {
                  x: (position.x - videoBounds.x) / videoBounds.width,
                  y: (position.y - videoBounds.y) / videoBounds.height,
                  width: parseInt(ref.style.width) / videoBounds.width,
                  height: parseInt(ref.style.height) / videoBounds.height,
                };
                onUpdateEffect(effect.id, { region: newRegion });
              }}
              style={{
                border: `2px solid ${EFFECT_COLORS[effect.type]}`,
                backgroundColor: EFFECT_BG_COLORS[effect.type],
                position: 'absolute',
                zIndex: 20 - index,
                outline: '2px dashed #fff',
                outlineOffset: '4px',
              }}
            >
              <CornerDots type={effect.type} />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEffect(effect.id);
                  onSetEditingEffect(null);
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
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: 0,
                  display: 'flex',
                  gap: 1,
                }}
              >
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onSetEditingEffect(null)}
                  sx={{
                    fontSize: '11px',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    bgcolor: '#52c41a',
                    '&:hover': { bgcolor: '#73d13d' },
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
              left: `${videoBounds.x + effect.region.x * videoBounds.width}px`,
              top: `${videoBounds.y + effect.region.y * videoBounds.height}px`,
              width: `${effect.region.width * videoBounds.width}px`,
              height: `${effect.region.height * videoBounds.height}px`,
              border: `2px solid ${EFFECT_COLORS[effect.type]}`,
              backgroundColor: EFFECT_BG_COLORS[effect.type],
              pointerEvents: 'auto',
              cursor: 'pointer',
              zIndex: 15 - index,
              '&:hover': {
                opacity: 0.8,
                '& .delete-button': {
                  opacity: 1,
                },
              },
            }}
            onClick={() => onSetEditingEffect(effect.id)}
          >
            <IconButton
              className="delete-button"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteEffect(effect.id);
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
