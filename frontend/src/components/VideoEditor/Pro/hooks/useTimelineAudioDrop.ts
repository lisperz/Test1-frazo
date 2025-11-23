/**
 * Timeline Audio Drop Hook
 *
 * Handles drag-and-drop of audio files into the timeline effects track.
 * Creates segments automatically when audio files are dropped.
 */

import { useState, useCallback } from 'react';
import { useSegmentsStore } from '../../../../store/segmentsStore';

interface UseTimelineAudioDropProps {
  duration: number;
  onError?: (message: string) => void;
}

interface UseTimelineAudioDropReturn {
  isDragging: boolean;
  isOver: boolean;
  error: string | null;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (file: File) => void;
  clearError: () => void;
}

// Maximum audio file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Accepted audio formats
const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'audio/vorbis',
];

const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'];

export const useTimelineAudioDrop = ({
  duration,
  onError,
}: UseTimelineAudioDropProps): UseTimelineAudioDropReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { segments, addSegment } = useSegmentsStore();

  const showError = useCallback((message: string) => {
    setError(message);
    if (onError) {
      onError(message);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateFile = useCallback((file: File): boolean => {
    // Check if segment already exists
    if (segments.length > 0) {
      showError('Please delete the existing segment before adding a new audio file');
      return false;
    }

    // Check file type
    const isValidType = ACCEPTED_AUDIO_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      showError('Please upload a valid audio file (MP3, WAV, M4A, AAC, FLAC, OGG)');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      showError('Audio file is too large. Maximum size is 100MB');
      return false;
    }

    return true;
  }, [segments.length, showError]);

  const getAudioDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio file'));
      });

      audio.src = objectUrl;
    });
  }, []);

  const createSegmentFromAudio = useCallback(async (file: File) => {
    try {
      // Get audio duration
      const audioDuration = await getAudioDuration(file);

      // Calculate segment end time (min of audio duration and video duration)
      const endTime = Math.min(audioDuration, duration);

      // Generate unique ID and refId
      const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Extract filename without extension for label
      const fileName = file.name;
      const label = fileName.replace(/\.[^/.]+$/, '');

      // Create new segment
      const newSegment = {
        id: segmentId,
        startTime: 0,
        endTime: endTime,
        audioInput: {
          file: file,
          refId: refId,
          fileName: fileName,
          fileSize: file.size,
          duration: audioDuration,
        },
        label: label,
        color: '#f59e0b', // Amber color for segments
        createdAt: Date.now(),
      };

      // Add segment to store
      addSegment(newSegment);

      clearError();
    } catch (err) {
      showError('Failed to process audio file. Please try again.');
      console.error('Error creating segment from audio:', err);
    }
  }, [duration, getAudioDuration, addSegment, clearError, showError]);

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      createSegmentFromAudio(file);
    }
  }, [validateFile, createSegmentFromAudio]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setIsOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      showError('No files detected. Please try again.');
      return;
    }

    if (files.length > 1) {
      showError('Please drop only one audio file at a time');
      return;
    }

    const file = files[0];
    handleFileSelect(file);
  }, [handleFileSelect, showError]);

  return {
    isDragging,
    isOver,
    error,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    clearError,
  };
};
