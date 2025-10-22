/**
 * Hook for video submission and processing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoEffect } from '../../../../store/effectsStore';
import { getAuthHeaders } from '../utils/authUtils';
import { API_ENDPOINTS, AUTH_CONFIG, NAVIGATION_DELAYS } from '../constants/editorConstants';

interface UseSubmissionProps {
  videoFile: File | null;
  audioFile: File | null;
  effects: VideoEffect[];
}

export const useSubmission = ({
  videoFile,
  audioFile,
  effects,
}: UseSubmissionProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState('');

  const handleSubmit = async () => {
    if (!videoFile) {
      console.error('No video file available for submission');
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress('Preparing video for processing...');

    try {
      console.log('Submitting video for AI processing...');

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('display_name', `Video Processing - ${videoFile.name}`);

      // Include audio file for lip sync if uploaded
      if (audioFile) {
        formData.append('audio', audioFile);
        console.log('Including audio file for lip sync:', audioFile.name);
      }

      // Send region/effect data for targeted text removal
      if (effects.length > 0) {
        const effectsData = effects.map((effect) => ({
          type: effect.type,
          startTime: effect.startTime,
          endTime: effect.endTime,
          region: effect.region,
        }));
        console.log('Sending effects data to backend:', effectsData);
        formData.append('effects', JSON.stringify(effectsData));
      }

      // Choose API endpoint based on whether audio is provided
      const apiEndpoint = audioFile
        ? API_ENDPOINTS.SYNC_PROCESS
        : API_ENDPOINTS.DIRECT_PROCESS;

      const progressMessage = audioFile
        ? 'Uploading video and audio files for lip-sync processing...'
        : 'Uploading video and annotation data...';

      setSubmissionProgress(progressMessage);

      // Get auth token for API request
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      console.log('Token from localStorage:', token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN');

      const headers = getAuthHeaders();

      if (!token) {
        console.error('No authentication token found! User needs to be logged in.');
        setIsSubmitting(false);
        setSubmissionProgress('');
        alert('Not authenticated. Please refresh the page and try again.');
        return;
      }

      console.log('Sending request to:', apiEndpoint);
      console.log('Request headers:', headers);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Response status:', response.status);
      const result = await response.json();

      if (response.ok) {
        console.log('Video submitted successfully:', result);

        const successMessage = audioFile
          ? 'Lip-sync and text removal job created successfully! Redirecting to jobs page...'
          : 'Video processing job created successfully! Redirecting to jobs page...';

        setSubmissionProgress(successMessage);

        setTimeout(() => {
          navigate('/jobs');
        }, NAVIGATION_DELAYS.AFTER_SUBMIT);
      } else {
        console.error('Submission failed:', result);
        console.error('Response status:', response.status);
        console.error('Response details:', result);
        setSubmissionProgress('');
        setIsSubmitting(false);

        if (response.status === 403) {
          alert('Authentication failed. Please refresh the page to re-authenticate.');
          window.location.reload();
        } else {
          alert(`Submission failed: ${result.detail || result.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error submitting video:', error);
      setSubmissionProgress('');
      setIsSubmitting(false);
      alert('Error submitting video. Please try again.');
    }
  };

  return {
    isSubmitting,
    submissionProgress,
    handleSubmit,
  };
};
