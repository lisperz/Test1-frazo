import { useState, useCallback } from 'react';
import { validateVideoFile } from '../utils/fileValidation';

export const useVideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    // Simulate upload progress
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    };

    simulateProgress();

    // Create local URL for the video (bypasses backend upload temporarily)
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setLocalUrl(url);
      setUploading(false);
      setUploadProgress(100);
    }, 1000);
  };

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      const validation = validateVideoFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      uploadFile(file);
    }
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLocalUrl(null);
    setUploadProgress(0);
  };

  const clearError = () => setError(null);

  return {
    uploading,
    uploadProgress,
    error,
    selectedFile,
    localUrl,
    handleFileDrop,
    handleRemoveFile,
    clearError,
  };
};
