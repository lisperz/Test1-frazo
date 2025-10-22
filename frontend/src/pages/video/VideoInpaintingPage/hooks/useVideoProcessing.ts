import { useState, useCallback } from 'react';
import axios from 'axios';
import { ProcessingJob } from '../utils/types';
import { formatFileSize } from '../utils/helpers';

/**
 * Custom hook for video processing operations
 * Handles upload, polling, and job state management
 */
export const useVideoProcessing = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Poll job status from backend
   */
  const pollJobStatus = useCallback(async (jobId: string, taskId: string) => {
    const maxAttempts = 60; // 30 minutes with 30-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/v1/jobs/${taskId}/status`);
        const statusData = response.data.status_check;

        if (statusData.status === 'status_check_successful') {
          const jobStatus = statusData.job_status;

          if (jobStatus.status === 'COMPLETED') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      status: 'completed',
                      progress: 100,
                      downloadUrl: jobStatus.url,
                    }
                  : job
              )
            );
            return;
          } else if (jobStatus.status === 'PROCESSING') {
            const progress = jobStatus.progress || 0;
            setJobs((prev) =>
              prev.map((job) => (job.id === jobId ? { ...job, progress } : job))
            );
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000);
        } else {
          setJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'error',
                    error: 'Processing timeout - check Ghostcut dashboard',
                  }
                : job
            )
          );
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000);
        }
      }
    };

    poll();
  }, []);

  /**
   * Handle file upload
   */
  const handleUpload = useCallback(
    async (acceptedFiles: File[]) => {
      const videoFile = acceptedFiles[0];
      if (!videoFile) return;

      if (!videoFile.type.startsWith('video/')) {
        alert('Please upload a video file');
        return;
      }

      const jobId = Date.now().toString();
      const newJob: ProcessingJob = {
        id: jobId,
        filename: videoFile.name,
        status: 'uploading',
        progress: 0,
        fileSize: formatFileSize(videoFile.size),
      };

      setJobs((prev) => [newJob, ...prev]);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', videoFile);

        const response = await axios.post('/api/v1/jobs/submit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setJobs((prev) =>
              prev.map((job) =>
                job.id === jobId ? { ...job, progress: percentCompleted } : job
              )
            );
          },
        });

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: 'processing',
                  progress: 0,
                  taskId: response.data.task_id,
                }
              : job
          )
        );

        pollJobStatus(jobId, response.data.task_id);
      } catch (error: any) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: 'error',
                  error: error.response?.data?.detail || 'Upload failed',
                }
              : job
          )
        );
      } finally {
        setIsUploading(false);
      }
    },
    [pollJobStatus]
  );

  /**
   * Remove job from list
   */
  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  }, []);

  return {
    jobs,
    isUploading,
    handleUpload,
    removeJob,
  };
};
