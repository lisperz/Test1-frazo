/**
 * Video Thumbnails Hook
 *
 * Generates and manages video thumbnails for the timeline display.
 */

import { useState, useEffect } from 'react';
import { TIMELINE_CONSTANTS } from '../constants/editorConstants';

export interface UseVideoThumbnailsReturn {
  /** Array of thumbnail data URLs */
  thumbnails: string[];
}

/**
 * Custom hook for generating video thumbnails
 *
 * @param videoUrl - URL of the video
 * @param duration - Video duration in seconds
 * @returns Array of thumbnail data URLs
 */
export const useVideoThumbnails = (
  videoUrl: string,
  duration: number
): UseVideoThumbnailsReturn => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    if (!videoUrl || duration <= 0) {
      return;
    }

    const generateThumbnails = async () => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';

      // Wait for metadata to load
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { THUMBNAIL_COUNT, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, THUMBNAIL_QUALITY } =
        TIMELINE_CONSTANTS;

      const interval = video.duration / THUMBNAIL_COUNT;
      const thumbs: string[] = [];

      // Generate thumbnails at regular intervals
      for (let i = 0; i < THUMBNAIL_COUNT; i++) {
        video.currentTime = i * interval;

        // Wait for seek to complete
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        // Draw frame to canvas
        canvas.width = THUMBNAIL_WIDTH;
        canvas.height = THUMBNAIL_HEIGHT;
        ctx.drawImage(video, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);

        // Convert to data URL
        thumbs.push(canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY));
      }

      setThumbnails(thumbs);
    };

    generateThumbnails();
  }, [videoUrl, duration]);

  return { thumbnails };
};
