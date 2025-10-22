import { useState, useCallback } from 'react';
import axios from 'axios';
import { ProcessingJob } from '../types';

export const useVideoUpload = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const pollJobStatus = useCallback(async (jobId: string, taskId: string) => {
    const maxAttempts = 60; // 30 minutes with 30-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`/api/v1/jobs/${taskId}/status`);
        const statusData = response.data.status_check;

        if (statusData && statusData.job_status) {
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
            const progress = jobStatus.progress || Math.min(attempts * 2, 95);
            setJobs((prev) =>
              prev.map((job) => (job.id === jobId ? { ...job, progress } : job))
            );
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 30000); // Poll every 30 seconds
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

  const uploadVideo = useCallback(async (videoFile: File) => {
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
      fileSize: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
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
                taskId: response.data.task_id || response.data.processing_result?.task_id,
              }
            : job
        )
      );

      const taskId = response.data.task_id || response.data.processing_result?.task_id;
      if (taskId) {
        pollJobStatus(jobId, taskId);
      }
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
  }, [pollJobStatus]);

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  }, []);

  const downloadVideo = useCallback((downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `processed_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    jobs,
    isUploading,
    uploadVideo,
    removeJob,
    downloadVideo,
  };
};
