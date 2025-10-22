/**
 * Effect Drawing Hook
 *
 * Manages drawing mode for creating and editing video effects on the player.
 */

import { useState, useCallback } from 'react';
import { useEffectsStore, VideoEffect } from '../../../../store/effectsStore';
import { EffectType, RectRegion } from '../types';
import { TIMELINE_CONSTANTS } from '../constants/editorConstants';

export interface UseEffectDrawingReturn {
  // Drawing state
  isDrawingMode: boolean;
  currentRect: RectRegion | null;
  selectedType: EffectType;
  editingEffectId: string | null;

  // Actions
  handleAddEffect: (type: EffectType) => void;
  handleSaveRect: () => void;
  handleCancelDrawing: () => void;
  setCurrentRect: (rect: RectRegion | null) => void;
  setEditingEffectId: (id: string | null) => void;
  handleStopEditing: () => void;
}

/**
 * Custom hook for managing effect drawing and editing
 *
 * @returns Drawing state and control functions
 */
export const useEffectDrawing = (): UseEffectDrawingReturn => {
  // Local state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentRect, setCurrentRect] = useState<RectRegion | null>(null);
  const [selectedType, setSelectedType] = useState<EffectType>('erasure');
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);

  // Store actions
  const { addEffect, currentTime, duration } = useEffectsStore();

  /**
   * Initiates drawing mode for a new effect
   *
   * @param type - Type of effect to create
   */
  const handleAddEffect = useCallback((type: EffectType) => {
    setSelectedType(type);
    setIsDrawingMode(true);

    // Create a default rectangle (centered, 40% of video size)
    setCurrentRect({
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.4,
    });
  }, []);

  /**
   * Saves the current rectangle as a new effect
   */
  const handleSaveRect = useCallback(() => {
    if (!currentRect) return;

    const startTime = currentTime;
    const endTime = Math.min(
      currentTime + TIMELINE_CONSTANTS.DEFAULT_EFFECT_DURATION,
      duration
    );

    const newEffect: VideoEffect = {
      id: `effect_${Date.now()}`,
      type: selectedType,
      startTime,
      endTime,
      region: currentRect,
    };

    addEffect(newEffect);

    // Reset drawing state
    setCurrentRect(null);
    setIsDrawingMode(false);
  }, [currentRect, currentTime, duration, selectedType, addEffect]);

  /**
   * Cancels current drawing operation
   */
  const handleCancelDrawing = useCallback(() => {
    setCurrentRect(null);
    setIsDrawingMode(false);
  }, []);

  /**
   * Exits edit mode for an effect
   */
  const handleStopEditing = useCallback(() => {
    setEditingEffectId(null);
  }, []);

  return {
    // Drawing state
    isDrawingMode,
    currentRect,
    selectedType,
    editingEffectId,

    // Actions
    handleAddEffect,
    handleSaveRect,
    handleCancelDrawing,
    setCurrentRect,
    setEditingEffectId,
    handleStopEditing,
  };
};
