/**
 * Hook for managing video effects and timeline effects
 */

import { useState, useEffect } from 'react';
import { VideoEffect } from '../../../../store/effectsStore';
import { TimelineEffect, EffectType, RectRegion } from '../types';
import { EFFECT_COLORS, EFFECT_LABELS, TIMELINE_CONFIG } from '../constants/editorConstants';

interface UseEffectManagementProps {
  effects: VideoEffect[];
  addEffect: (effect: VideoEffect) => void;
  updateEffect: (id: string, updates: Partial<VideoEffect>) => void;
  deleteEffect: (id: string) => void;
  currentTime: number;
  duration: number;
}

export const useEffectManagement = ({
  effects,
  addEffect,
  updateEffect,
  deleteEffect,
  currentTime,
  duration,
}: UseEffectManagementProps) => {
  const [timelineEffects, setTimelineEffects] = useState<TimelineEffect[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentRect, setCurrentRect] = useState<RectRegion | null>(null);
  const [selectedType, setSelectedType] = useState<EffectType>('erasure');
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);

  // Synchronize timeline effects with main effects store
  useEffect(() => {
    const syncedTimelineEffects: TimelineEffect[] = effects.map((effect) => ({
      id: effect.id,
      type: effect.type,
      startFrame: (effect.startTime / duration) * 100,
      endFrame: (effect.endTime / duration) * 100,
      color: EFFECT_COLORS[effect.type],
      label: EFFECT_LABELS[effect.type],
    }));

    setTimelineEffects(syncedTimelineEffects);
  }, [effects, duration]);

  const handleAddEffect = (type: EffectType) => {
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

  const handleSaveRect = () => {
    if (!currentRect) return;

    const startTime = currentTime;
    const endTime = Math.min(
      currentTime + TIMELINE_CONFIG.DEFAULT_EFFECT_DURATION,
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
    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  const handleCancelDrawing = () => {
    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  const handleDeleteTimelineEffect = (id: string) => {
    deleteEffect(id);
  };

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

  const handleStopEditing = () => {
    setEditingEffectId(null);
  };

  return {
    timelineEffects,
    isDrawingMode,
    currentRect,
    setCurrentRect,
    selectedType,
    editingEffectId,
    handleAddEffect,
    handleSaveRect,
    handleCancelDrawing,
    handleDeleteTimelineEffect,
    handleEffectClick,
    handleStopEditing,
  };
};
