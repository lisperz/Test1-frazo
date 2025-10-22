/**
 * Video-related utility functions for GhostCut Editor
 */

import { TIMELINE_CONFIG } from '../constants/editorConstants';
import { VideoBounds } from '../types';

/**
 * Calculate actual video display bounds within the container
 */
export const calculateVideoBounds = (
  playerRef: React.RefObject<any>,
  containerRef: React.RefObject<HTMLDivElement | null>
): VideoBounds | null => {
  if (!playerRef.current || !containerRef.current) return null;

  const internalPlayer = playerRef.current.getInternalPlayer();
  if (!internalPlayer || !internalPlayer.videoWidth || !internalPlayer.videoHeight) {
    return null;
  }

  const container = containerRef.current;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const videoAspectRatio = internalPlayer.videoWidth / internalPlayer.videoHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let videoDisplayWidth: number;
  let videoDisplayHeight: number;
  let videoX: number;
  let videoY: number;

  if (videoAspectRatio > containerAspectRatio) {
    // Video is wider - fit to width, letterbox top/bottom
    videoDisplayWidth = containerWidth;
    videoDisplayHeight = containerWidth / videoAspectRatio;
    videoX = 0;
    videoY = (containerHeight - videoDisplayHeight) / 2;
  } else {
    // Video is taller - fit to height, letterbox left/right
    videoDisplayHeight = containerHeight;
    videoDisplayWidth = containerHeight * videoAspectRatio;
    videoX = (containerWidth - videoDisplayWidth) / 2;
    videoY = 0;
  }

  return {
    x: videoX,
    y: videoY,
    width: videoDisplayWidth,
    height: videoDisplayHeight,
  };
};

/**
 * Generate video thumbnails for timeline
 */
export const generateThumbnails = async (
  videoUrl: string
): Promise<string[]> => {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';

  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const frameCount = TIMELINE_CONFIG.THUMBNAIL_COUNT;
  const interval = video.duration / frameCount;
  const thumbs: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    video.currentTime = i * interval;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    canvas.width = TIMELINE_CONFIG.THUMBNAIL_WIDTH;
    canvas.height = TIMELINE_CONFIG.THUMBNAIL_HEIGHT;
    ctx.drawImage(
      video,
      0,
      0,
      TIMELINE_CONFIG.THUMBNAIL_WIDTH,
      TIMELINE_CONFIG.THUMBNAIL_HEIGHT
    );
    thumbs.push(canvas.toDataURL('image/jpeg', TIMELINE_CONFIG.THUMBNAIL_QUALITY));
  }

  return thumbs;
};
