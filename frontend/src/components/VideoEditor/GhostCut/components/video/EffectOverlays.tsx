/**
 * Effect overlays for video player (rectangles and editing UI)
 */

import React from 'react';
import { Box } from '@mui/material';
import { VideoEffect } from '../../../../../store/effectsStore';
import { VideoBounds, RectRegion, EffectType } from '../../types';
import { DrawingOverlay } from './DrawingOverlay';
import { ExistingEffects } from './ExistingEffects';

interface EffectOverlaysProps {
  videoBounds: VideoBounds | null;
  isDrawingMode: boolean;
  currentRect: RectRegion | null;
  setCurrentRect: (rect: RectRegion | null) => void;
  selectedType: EffectType;
  currentTime: number;
  duration: number;
  onSaveRect: () => void;
  onCancelDrawing: () => void;
  effects: VideoEffect[];
  editingEffectId: string | null;
  onUpdateEffect: (id: string, updates: Partial<VideoEffect>) => void;
  onDeleteEffect: (id: string) => void;
  onSetEditingEffect: (id: string | null) => void;
}

export const EffectOverlays: React.FC<EffectOverlaysProps> = ({
  videoBounds,
  isDrawingMode,
  currentRect,
  setCurrentRect,
  selectedType,
  currentTime,
  duration,
  onSaveRect,
  onCancelDrawing,
  effects,
  editingEffectId,
  onUpdateEffect,
  onDeleteEffect,
  onSetEditingEffect,
}) => {
  if (!videoBounds) return null;

  return (
    <>
      {/* Video bounds container */}
      <Box
        className="video-bounds-container"
        sx={{
          position: 'absolute',
          left: videoBounds.x,
          top: videoBounds.y,
          width: videoBounds.width,
          height: videoBounds.height,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Drawing Rectangle Overlay */}
      {isDrawingMode && currentRect && (
        <DrawingOverlay
          videoBounds={videoBounds}
          currentRect={currentRect}
          setCurrentRect={setCurrentRect}
          selectedType={selectedType}
          currentTime={currentTime}
          duration={duration}
          onSaveRect={onSaveRect}
          onCancelDrawing={onCancelDrawing}
        />
      )}

      {/* Display existing effects */}
      <ExistingEffects
        videoBounds={videoBounds}
        effects={effects}
        currentTime={currentTime}
        editingEffectId={editingEffectId}
        onUpdateEffect={onUpdateEffect}
        onDeleteEffect={onDeleteEffect}
        onSetEditingEffect={onSetEditingEffect}
      />
    </>
  );
};
