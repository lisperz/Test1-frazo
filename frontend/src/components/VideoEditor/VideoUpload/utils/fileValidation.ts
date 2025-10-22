export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid video file (MP4, MPEG, MOV, AVI)',
    };
  }

  const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 2GB',
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
