/**
 * Helper functions for video inpainting operations
 */

/**
 * Download a video file from URL
 */
export const downloadVideo = (downloadUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `processed_${filename}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format file size in bytes to MB
 */
export const formatFileSize = (bytes: number): string => {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
