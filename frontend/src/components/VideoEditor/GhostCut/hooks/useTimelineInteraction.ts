/**
 * Hook for timeline interaction and dragging
 */

import { useState } from 'react';
import { handleTimelineInteraction, clampTime } from '../../../../utils/timelineUtils';
import { VideoEffect } from '../../../../store/effectsStore';
import { TIMELINE_CONFIG } from '../constants/editorConstants';

interface UseTimelineInteractionProps {
  duration: number;
  timelineZoom: number;
  effects: VideoEffect[];
  updateEffect: (id: string, updates: Partial<VideoEffect>) => void;
  handleSeek: (time: number) => void;
}

export const useTimelineInteraction = ({
  duration,
  timelineZoom,
  effects,
  updateEffect,
  handleSeek,
}: UseTimelineInteractionProps) => {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);

  const handleTimelineEffectDrag = (
    e: React.MouseEvent,
    effectId: string,
    type: 'start' | 'end' | 'move',
    frameStripRef: React.RefObject<HTMLDivElement | null>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(effectId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!frameStripRef.current) return;

      const newTime = handleTimelineInteraction(
        moveEvent,
        frameStripRef.current,
        duration,
        timelineZoom
      );

      const effect = effects.find((e) => e.id === effectId);
      if (effect) {
        if (type === 'start') {
          const maxStartTime = effect.endTime - TIMELINE_CONFIG.MIN_EFFECT_DURATION;
          const newStartTime = Math.min(newTime, maxStartTime);
          updateEffect(effectId, { startTime: newStartTime });
        } else if (type === 'end') {
          const minEndTime = effect.startTime + TIMELINE_CONFIG.MIN_EFFECT_DURATION;
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

  const handleTimelineRulerDrag = (
    e: React.MouseEvent,
    currentTime: number,
    timelineContainer: HTMLElement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTimeline(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newTime = handleTimelineInteraction(
        moveEvent,
        timelineContainer,
        duration,
        timelineZoom
      );
      handleSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingTimeline(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    isDragging,
    isDraggingTimeline,
    setIsDraggingTimeline,
    handleTimelineEffectDrag,
    handleTimelineRulerDrag,
  };
};
