/**
 * Corner dots for effect rectangles
 */

import React from 'react';
import { Box } from '@mui/material';
import { EffectType } from '../../types';
import { EFFECT_COLORS, EFFECT_HOVER_COLORS } from '../../constants/editorConstants';

interface CornerDotsProps {
  type: EffectType;
}

export const CornerDots: React.FC<CornerDotsProps> = ({ type }) => {
  const dotColor = EFFECT_COLORS[type];
  const hoverColor = EFFECT_HOVER_COLORS[type];

  return (
    <>
      {['nw', 'ne', 'sw', 'se'].map((position) => (
        <Box
          key={position}
          sx={{
            position: 'absolute',
            ...(position.includes('n') ? { top: -4 } : { bottom: -4 }),
            ...(position.includes('w') ? { left: -4 } : { right: -4 }),
            width: 8,
            height: 8,
            backgroundColor: dotColor,
            border: '2px solid white',
            borderRadius: '50%',
            cursor: `${position}-resize`,
            pointerEvents: 'auto',
            '&:hover': {
              backgroundColor: hoverColor,
              transform: 'scale(1.2)',
            },
          }}
        />
      ))}
    </>
  );
};
