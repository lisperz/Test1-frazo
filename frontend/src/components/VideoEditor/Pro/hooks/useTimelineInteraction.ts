/**
 * Timeline Interaction Hook
 *
 * Manages user interactions with timeline effects, including dragging
 * effect bars to adjust start/end times or move them entirely.
 */

import { useState, useCallback } from 'react';
import { useEffectsStore } from '../../../../store/effectsStore';
import { handleTimelineInteraction, clampTime } from '../../../../utils/timelineUtils';
import { DragType } from '../types';
import { TIMELINE_CONSTANTS } from '../constants/editorConstants';

export interface UseTimelineInteractionReturn {
  /** ID of effect currently being dragged, null if none */
  isDragging: string | null;
  /** Whether timeline indicator is being dragged */
  isDraggingTimeline: boolean;
  /** Handler for timeline effect drag operations */
  handleTimelineEffectDrag: (
    e: React.MouseEvent,
    effectId: string,
    type: DragType
  ) => void;
  /** Setter for timeline dragging state */
  setIsDraggingTimeline: (value: boolean) => void;
}

/**
 * Custom hook for managing timeline effect interactions
 *
 * @param frameStripRef - Reference to the frame strip element
 * @param duration - Video duration in seconds
 * @param timelineZoom - Current timeline zoom level
 * @returns Timeline interaction state and handlers
 */
export const useTimelineInteraction = (
  frameStripRef: React.RefObject<HTMLDivElement | null>,
  duration: number,
  timelineZoom: number
): UseTimelineInteractionReturn => {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  const { effects, updateEffect } = useEffectsStore();

  /**
   * Handles dragging timeline effects to adjust timing
   *
   * @param e - Mouse event that initiated the drag
   * @param effectId - ID of the effect being dragged
   * @param type - Type of drag operation (start, end, or move)
   */
  const handleTimelineEffectDrag = useCallback((
    e: React.MouseEvent,
    effectId: string,
    type: DragType
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(effectId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!frameStripRef.current) return;

      // Use centralized timeline interaction for precise calculation
      const newTime = handleTimelineInteraction(
        moveEvent,
        frameStripRef.current,
        duration,
        timelineZoom
      );

      // Update the effect in store
      const effect = effects.find(e => e.id === effectId);
      if (!effect) return;

      if (type === 'start') {
        // Adjust start time, ensuring minimum duration
        const maxStartTime = effect.endTime - TIMELINE_CONSTANTS.MIN_EFFECT_DURATION;
        const newStartTime = Math.min(newTime, maxStartTime);
        updateEffect(effectId, { startTime: newStartTime });
      } else if (type === 'end') {
        // Adjust end time, ensuring minimum duration
        const minEndTime = effect.startTime + TIMELINE_CONSTANTS.MIN_EFFECT_DURATION;
        const newEndTime = Math.max(minEndTime, newTime);
        updateEffect(effectId, { endTime: clampTime(newEndTime, duration) });
      } else if (type === 'move') {
        // Move entire effect, maintaining duration
        const effectDuration = effect.endTime - effect.startTime;
        const newStartTime = clampTime(newTime - effectDuration / 2, duration - effectDuration);
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
  }, [frameStripRef, duration, timelineZoom, effects, updateEffect]);

  return {
    isDragging,
    isDraggingTimeline,
    handleTimelineEffectDrag,
    setIsDraggingTimeline,
  };
};
