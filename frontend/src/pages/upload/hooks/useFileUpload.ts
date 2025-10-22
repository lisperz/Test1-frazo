import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../../services/api';
import { removeFileExtension } from '../utils/formatters';

export const useFileUpload = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFiles(acceptedFiles);
      const newDisplayNames: Record<string, string> = {};
      acceptedFiles.forEach(file => {
        newDisplayNames[file.name] = removeFileExtension(file.name);
      });
      setDisplayNames(newDisplayNames);
      setUploadError('');
    }
  }, []);

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove));
    setDisplayNames(prev => {
      const newNames = { ...prev };
      delete newNames[fileToRemove.name];
      return newNames;
    });
    if (selectedFiles.length === 1) {
      setUploadError('');
    }
  };

  const handleDisplayNameChange = (fileName: string, newName: string) => {
    setDisplayNames(prev => ({ ...prev, [fileName]: newName }));
  };

  const processAllFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploadError('');
    setUploadingCount(selectedFiles.length);
    setUploadedCount(0);

    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        const response = await jobsApi.uploadAndProcess(
          file,
          displayNames[file.name] || removeFileExtension(file.name)
        );
        setUploadedCount(prev => prev + 1);
        return response;
      } catch (error: any) {
        console.error(`Upload error for ${file.name}:`, error);
        return null;
      }
    });

    await Promise.all(uploadPromises);

    setShowSuccess(true);
    setTimeout(() => {
      navigate('/history');
    }, 1500);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    await processAllFiles();
  };

  return {
    selectedFiles,
    displayNames,
    uploadError,
    showSuccess,
    uploadingCount,
    uploadedCount,
    onDrop,
    handleRemoveFile,
    handleDisplayNameChange,
    handleSubmit,
    setShowSuccess,
  };
};
