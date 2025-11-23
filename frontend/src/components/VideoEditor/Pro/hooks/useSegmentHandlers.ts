/**
 * Segment Handlers Hook
 * Manages segment operations: add, edit, split, drag, delete
 */

import { useState } from 'react';
import { useSegmentsStore } from '../../../../store/segmentsStore';
import { clampTime } from '../../../../utils/timelineUtils';

export interface SegmentHandlers {
  isSegmentDialogOpen: boolean;
  editingSegmentId: string | null;
  handleAddSegment: () => void;
  handleCloseDialog: () => void;
  handleSplitSegment: () => void;
  handleSegmentDrag: (
    e: React.MouseEvent,
    segmentId: string,
    type: 'start' | 'end' | 'move',
    frameStripRef: React.RefObject<HTMLDivElement>,
    timelineZoom: number
  ) => void;
}

export const useSegmentHandlers = (
  currentTime: number,
  duration: number
): SegmentHandlers => {
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const {
    segments,
    updateSegment,
    splitSegmentAtTime,
    getSegmentAtTime,
  } = useSegmentsStore();

  // Handle split segment at current playhead position
  const handleSplitSegment = () => {
    if (!duration || currentTime <= 0 || currentTime >= duration) {
      console.warn('Cannot split: invalid time position');
      return;
    }

    const segmentAtTime = getSegmentAtTime(currentTime);
    if (!segmentAtTime) {
      console.warn('No segment found at current time:', currentTime);
      return;
    }

    // Prevent splitting too close to the edges (minimum 0.5s per piece)
    const minDuration = 0.5;
    const firstHalfDuration = currentTime - segmentAtTime.startTime;
    const secondHalfDuration = segmentAtTime.endTime - currentTime;

    if (firstHalfDuration < minDuration || secondHalfDuration < minDuration) {
      console.warn(
        'Cannot split: resulting segments would be too short (minimum 0.5s)'
      );
      alert(
        'Cannot split here. Each resulting segment must be at least 0.5 seconds long.'
      );
      return;
    }

    console.log('✂️ Splitting segment at time:', currentTime);
    const success = splitSegmentAtTime(currentTime);

    if (success) {
      console.log('✂️ Split successful!');
    } else {
      console.error('✂️ Split failed');
    }
  };

  // Handle add segment button
  const handleAddSegment = () => {
    console.log('=== ADD SEGMENT BUTTON CLICKED ===');
    console.log('Opening segment dialog');
    setEditingSegmentId(null);
    setIsSegmentDialogOpen(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    console.log('=== CLOSING SEGMENT DIALOG ===');
    setIsSegmentDialogOpen(false);
    setEditingSegmentId(null);
  };

  // Handle segment drag (start/end/move)
  const handleSegmentDrag = (
    e: React.MouseEvent,
    segmentId: string,
    type: 'start' | 'end' | 'move',
    frameStripRef: React.RefObject<HTMLDivElement>,
    timelineZoom: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const segment = segments.find((seg) => seg.id === segmentId);
    if (!segment || !frameStripRef.current) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!frameStripRef.current) return;

      const rect = frameStripRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const newTime = (percentage / 100) * duration;

      if (type === 'start') {
        const maxStartTime = segment.endTime - 0.5; // Minimum 0.5s duration
        const newStartTime = Math.max(0, Math.min(newTime, maxStartTime));

        // Calculate audio duration change
        const segmentDurationChange = newStartTime - segment.startTime;

        // Update segment with new start time and adjusted audio times
        updateSegment(segmentId, {
          startTime: newStartTime,
          audioInput: {
            ...segment.audioInput,
            startTime:
              segment.audioInput.startTime !== undefined
                ? Math.max(0, segment.audioInput.startTime + segmentDurationChange)
                : undefined,
          },
        });
      } else if (type === 'end') {
        const minEndTime = segment.startTime + 0.5; // Minimum 0.5s duration

        // Calculate maximum allowed end time
        // Allow extending up to the FULL original audio duration, not just the segment's crop range
        let maxAllowedEndTime = duration; // Default to video duration

        if (segment.audioInput.duration) {
          // Max segment end = min(video duration, original audio duration)
          // This allows any segment to extend to the full audio length
          maxAllowedEndTime = Math.min(duration, segment.audioInput.duration);
        }

        const newEndTime = Math.min(maxAllowedEndTime, Math.max(minEndTime, newTime));

        // Calculate how much the segment end time changed
        const segmentDurationChange = newEndTime - segment.endTime;

        // When dragging the end, extend the audio end time proportionally
        const currentAudioEnd = segment.audioInput.endTime ?? segment.audioInput.duration ?? segment.endTime;
        const newAudioEndTime = currentAudioEnd + segmentDurationChange;

        // Update segment with new end time and adjusted audio end time
        updateSegment(segmentId, {
          endTime: newEndTime,
          audioInput: {
            ...segment.audioInput,
            endTime: Math.min(
              segment.audioInput.duration ?? newAudioEndTime,
              newAudioEndTime
            ),
          },
        });
      } else if (type === 'move') {
        const segmentDuration = segment.endTime - segment.startTime;

        // Calculate maximum allowed position based on video and audio duration
        // Allow moving as long as the segment end doesn't exceed the full audio duration
        let maxStartPosition = duration - segmentDuration;

        if (segment.audioInput.duration) {
          // Ensure segment end (after move) doesn't exceed original audio duration
          // maxStartPosition = min(video duration - segment duration, audio duration - segment duration)
          const maxAllowedByAudio = segment.audioInput.duration - segmentDuration;
          maxStartPosition = Math.min(maxStartPosition, Math.max(0, maxAllowedByAudio));
        }

        const newStartTime = clampTime(
          newTime - segmentDuration / 2,
          maxStartPosition
        );
        const newEndTime = newStartTime + segmentDuration;

        // Calculate how much the segment moved
        const segmentTimeShift = newStartTime - segment.startTime;

        // Move segment and shift audio times by the same amount
        updateSegment(segmentId, {
          startTime: newStartTime,
          endTime: newEndTime,
          audioInput: {
            ...segment.audioInput,
            startTime:
              segment.audioInput.startTime !== undefined
                ? Math.max(0, Math.min(
                    segment.audioInput.duration ?? Infinity,
                    segment.audioInput.startTime + segmentTimeShift
                  ))
                : undefined,
            endTime:
              segment.audioInput.endTime !== undefined
                ? Math.max(0, Math.min(
                    segment.audioInput.duration ?? Infinity,
                    segment.audioInput.endTime + segmentTimeShift
                  ))
                : undefined,
          },
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    isSegmentDialogOpen,
    editingSegmentId,
    handleAddSegment,
    handleCloseDialog,
    handleSplitSegment,
    handleSegmentDrag,
  };
};
