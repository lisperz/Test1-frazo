/**
 * Video Submission Hook
 *
 * Handles the submission of Pro videos with segments and effects
 * to the backend API for processing.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffectsStore } from '../../../../store/effectsStore';
import { useSegmentsStore } from '../../../../store/segmentsStore';
import { API_ENDPOINTS } from '../constants/editorConstants';

export interface UseVideoSubmissionReturn {
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Current submission progress message */
  submissionProgress: string;
  /** Handler to submit the video for processing */
  handleSubmit: () => Promise<void>;
}

/**
 * Custom hook for handling Pro video submission
 *
 * @param videoFile - The video file to submit
 * @returns Submission state and handler
 */
export const useVideoSubmission = (
  videoFile: File | null
): UseVideoSubmissionReturn => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState('');

  const { effects } = useEffectsStore();
  const { segments } = useSegmentsStore();

  /**
   * Handles Pro video submission
   */
  const handleSubmit = useCallback(async () => {
    console.log('=== PRO VIDEO SUBMIT HANDLER ===');
    console.log('Segments count:', segments.length);
    console.log('Segments data:', segments);
    console.log('Effects count:', effects.length);
    console.log('Video file:', videoFile);

    if (!videoFile) {
      console.error('No video file available for submission');
      alert('Please upload a video file');
      return;
    }

    if (segments.length === 0) {
      console.error('No segments configured - segments array is empty!');
      alert('Please add at least one segment for Pro video processing');
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress('Preparing Pro video for processing...');

    try {
      console.log('Submitting Pro video with', segments.length, 'segments');

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('display_name', `Pro Video - ${videoFile.name}`);

      // Add only UNIQUE audio files (deduplicate by refId)
      // This is important when the same audio file is reused across multiple segments
      const uniqueAudioMap = new Map<string, File>();
      segments.forEach(seg => {
        if (seg.audioInput.file && !uniqueAudioMap.has(seg.audioInput.refId)) {
          uniqueAudioMap.set(seg.audioInput.refId, seg.audioInput.file);
        }
      });

      // Append unique audio files in the order their refIds appear
      uniqueAudioMap.forEach((file) => {
        formData.append('audio_files', file);
      });

      console.log('Including', uniqueAudioMap.size, 'unique audio files for', segments.length, 'segments');
      console.log('Unique audio refIds:', Array.from(uniqueAudioMap.keys()));
      console.log('RAW SEGMENTS FROM STORE:', JSON.stringify(segments, null, 2));

      // Build segments data for API
      const segmentsData = segments.map(seg => {
        // Per Sync.so docs: audioInput times are REQUIRED when multiple segments share the same audio
        // This tells Sync.so which portion of the audio file to use for each segment
        const audioInput: {
          refId: string;
          startTime?: number;
          endTime?: number;
        } = {
          refId: seg.audioInput.refId,
        };

        // ALWAYS include audio crop times if they are set in the segment
        // This is critical when multiple segments use the same audio file
        if (seg.audioInput.startTime !== null && seg.audioInput.startTime !== undefined) {
          audioInput.startTime = seg.audioInput.startTime;
        }
        if (seg.audioInput.endTime !== null && seg.audioInput.endTime !== undefined) {
          audioInput.endTime = seg.audioInput.endTime;
        }

        return {
          startTime: seg.startTime,
          endTime: seg.endTime,
          audioInput,
        };
      });

      formData.append('segments_data', JSON.stringify(segmentsData));
      console.log('Segments configuration:', JSON.stringify(segmentsData, null, 2));

      // Include effects data if any
      if (effects.length > 0) {
        const effectsData = effects.map(effect => ({
          type: effect.type,
          startTime: effect.startTime,
          endTime: effect.endTime,
          region: effect.region,
        }));
        formData.append('effects', JSON.stringify(effectsData));
        console.log('Including', effects.length, 'effects');
      }

      setSubmissionProgress('Uploading video and audio files for Pro processing...');

      // Get auth token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No authentication token found');
        setIsSubmitting(false);
        setSubmissionProgress('');
        alert('Not authenticated. Please refresh the page and try again.');
        return;
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      console.log('Sending request to Pro API endpoint');

      const response = await fetch(API_ENDPOINTS.PRO_SYNC_PROCESS, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Response status:', response.status);
      const result = await response.json();

      if (response.ok) {
        console.log('Pro video submitted successfully:', result);
        setSubmissionProgress('Pro job created successfully! Redirecting to jobs page...');

        // Navigate to jobs page
        setTimeout(() => {
          navigate('/jobs');
        }, 1500);
      } else {
        console.error('Submission failed:', result);
        setSubmissionProgress('');
        setIsSubmitting(false);

        if (response.status === 403) {
          alert('Insufficient permissions. Pro tier subscription required.');
        } else {
          alert(`Submission failed: ${result.detail || result.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error submitting Pro video:', error);
      setSubmissionProgress('');
      setIsSubmitting(false);
      alert('Error submitting video. Please try again.');
    }
  }, [videoFile, segments, effects, navigate]);

  return {
    isSubmitting,
    submissionProgress,
    handleSubmit,
  };
};
