/**
 * Video Bounds Hook
 *
 * Calculates and manages the actual display bounds of the video within its container.
 * Handles aspect ratio calculations and window resize events.
 */

import { useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { VideoBounds } from '../types';
import { TIMELINE_CONSTANTS } from '../constants/editorConstants';

export interface UseVideoBoundsReturn {
  /** Current video display bounds, null if not yet calculated */
  videoBounds: VideoBounds | null;
}

/**
 * Custom hook for calculating video display bounds
 *
 * @param playerRef - Reference to ReactPlayer instance
 * @param videoContainerRef - Reference to video container element
 * @param isVideoReady - Whether the video is ready for playback
 * @returns Video bounds object
 */
export const useVideoBounds = (
  playerRef: React.RefObject<ReactPlayer | null>,
  videoContainerRef: React.RefObject<HTMLDivElement | null>,
  isVideoReady: boolean
): UseVideoBoundsReturn => {
  const [videoBounds, setVideoBounds] = useState<VideoBounds | null>(null);

  /**
   * Calculates actual video display bounds within the container
   * Takes into account aspect ratio and letterboxing
   *
   * @returns Video bounds or null if not calculable
   */
  const calculateVideoBounds = useCallback((): VideoBounds | null => {
    if (!playerRef.current || !videoContainerRef.current) {
      return null;
    }

    const internalPlayer = playerRef.current.getInternalPlayer();
    if (!internalPlayer || !internalPlayer.videoWidth || !internalPlayer.videoHeight) {
      return null;
    }

    const container = videoContainerRef.current;
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
  }, [playerRef, videoContainerRef]);

  /**
   * Update video bounds when video becomes ready
   */
  useEffect(() => {
    if (!isVideoReady) return;

    const timer = setTimeout(() => {
      const bounds = calculateVideoBounds();
      if (bounds) {
        setVideoBounds(bounds);
      }
    }, TIMELINE_CONSTANTS.BOUNDS_CALCULATION_DELAY);

    return () => clearTimeout(timer);
  }, [isVideoReady, calculateVideoBounds]);

  /**
   * Recalculate bounds on window resize
   */
  useEffect(() => {
    if (!isVideoReady) return;

    const handleResize = () => {
      setTimeout(() => {
        const bounds = calculateVideoBounds();
        if (bounds) {
          setVideoBounds(bounds);
        }
      }, TIMELINE_CONSTANTS.BOUNDS_CALCULATION_DELAY);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVideoReady, calculateVideoBounds]);

  return { videoBounds };
};
