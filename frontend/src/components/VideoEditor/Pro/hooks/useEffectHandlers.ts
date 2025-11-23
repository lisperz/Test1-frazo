/**
 * Effect Handlers Hook
 * Manages video effect operations: drawing, editing, dragging
 */

import { useState } from 'react';
import { useEffectsStore, VideoEffect } from '../../../../store/effectsStore';
import { clampTime } from '../../../../utils/timelineUtils';

export interface EffectHandlers {
  isDrawingMode: boolean;
  currentRect: any;
  selectedType: 'erasure' | 'protection' | 'text';
  editingEffectId: string | null;
  isDragging: string | null;
  setIsDragging: (id: string | null) => void;
  handleAddEffect: (type: 'erasure' | 'protection' | 'text') => void;
  handleSaveRect: () => void;
  handleCancelDrawing: () => void;
  handleEffectDrag: (
    e: React.MouseEvent,
    effectId: string,
    type: 'start' | 'end' | 'move',
    frameStripRef: React.RefObject<HTMLDivElement>,
    timelineZoom: number
  ) => void;
  handleEffectClick: (effectId: string, e: React.MouseEvent) => void;
  handleStopEditing: () => void;
  setCurrentRect: (rect: any) => void;
}

export const useEffectHandlers = (
  currentTime: number,
  duration: number
): EffectHandlers => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentRect, setCurrentRect] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<
    'erasure' | 'protection' | 'text'
  >('erasure');
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const { addEffect, updateEffect, effects } = useEffectsStore();

  // Handle add effect - enters drawing mode
  const handleAddEffect = (type: 'erasure' | 'protection' | 'text') => {
    setSelectedType(type);
    setIsDrawingMode(true);

    // Create a default rectangle
    setCurrentRect({
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.4,
    });
  };

  // Handle save drawn rectangle
  const handleSaveRect = () => {
    if (!currentRect) return;

    const startTime = currentTime;
    const endTime = Math.min(currentTime + 5, duration);

    const newEffect: VideoEffect = {
      id: `effect_${Date.now()}`,
      type: selectedType,
      startTime,
      endTime,
      region: currentRect,
    };

    addEffect(newEffect);

    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  // Handle cancel drawing
  const handleCancelDrawing = () => {
    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  // Handle effect drag (start/end/move)
  const handleEffectDrag = (
    e: React.MouseEvent,
    effectId: string,
    type: 'start' | 'end' | 'move',
    frameStripRef: React.RefObject<HTMLDivElement>,
    timelineZoom: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(effectId);

    const effect = effects.find((ef) => ef.id === effectId);
    if (!effect || !frameStripRef.current) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!frameStripRef.current) return;

      const rect = frameStripRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const newTime = (percentage / 100) * duration;

      if (type === 'start') {
        const maxStartTime = effect.endTime - 0.1; // Minimum 0.1s duration
        const newStartTime = Math.min(newTime, maxStartTime);
        updateEffect(effectId, { startTime: newStartTime });
      } else if (type === 'end') {
        const minEndTime = effect.startTime + 0.1; // Minimum 0.1s duration
        const newEndTime = Math.max(minEndTime, newTime);
        updateEffect(effectId, { endTime: clampTime(newEndTime, duration) });
      } else if (type === 'move') {
        const effectDuration = effect.endTime - effect.startTime;
        const newStartTime = clampTime(
          newTime - effectDuration / 2,
          duration - effectDuration
        );
        const newEndTime = newStartTime + effectDuration;
        updateEffect(effectId, {
          startTime: newStartTime,
          endTime: newEndTime,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle effect click for selection
  const handleEffectClick = (effectId: string, e: React.MouseEvent) => {
    // Only handle clicks that are not on drag handles or delete button
    if (
      (e.target as HTMLElement).closest('[data-drag-handle]') ||
      (e.target as HTMLElement).closest('button')
    ) {
      return;
    }

    setEditingEffectId(effectId);
    setIsDrawingMode(false);
  };

  // Handle stop editing
  const handleStopEditing = () => {
    setEditingEffectId(null);
  };

  return {
    isDrawingMode,
    currentRect,
    selectedType,
    editingEffectId,
    isDragging,
    setIsDragging,
    handleAddEffect,
    handleSaveRect,
    handleCancelDrawing,
    handleEffectDrag,
    handleEffectClick,
    handleStopEditing,
    setCurrentRect,
  };
};
