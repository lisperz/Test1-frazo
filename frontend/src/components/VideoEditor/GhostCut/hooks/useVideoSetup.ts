/**
 * Hook for video setup and initialization
 */

import { useState, useEffect, useRef } from 'react';
import { generateThumbnails, calculateVideoBounds } from '../utils/videoUtils';
import { autoLogin } from '../utils/authUtils';
import { VideoBounds } from '../types';
import { VIDEO_CONFIG } from '../constants/editorConstants';

interface UseVideoSetupProps {
  videoUrl: string;
  duration: number;
  setStoreTime: (time: number) => void;
  setStoreDuration: (duration: number) => void;
}

export const useVideoSetup = ({
  videoUrl,
  duration,
  setStoreTime,
  setStoreDuration,
}: UseVideoSetupProps) => {
  const playerRef = useRef<any>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const frameStripRef = useRef<HTMLDivElement>(null);

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [videoBounds, setVideoBounds] = useState<VideoBounds | null>(null);

  // Auto-login on component mount
  useEffect(() => {
    autoLogin();
  }, []);

  // Generate video thumbnails
  useEffect(() => {
    if (videoUrl && playerRef.current && duration > 0) {
      generateThumbnails(videoUrl).then(setThumbnails);
    }
  }, [videoUrl, duration]);

  // Handle video ready event
  const handleReady = () => {
    console.log('Video ready');
    setIsVideoReady(true);

    // Calculate video bounds
    setTimeout(() => {
      const bounds = calculateVideoBounds(playerRef, videoContainerRef);
      if (bounds) {
        setVideoBounds(bounds);
      }
    }, VIDEO_CONFIG.READY_DELAY);

    // Get initial time from the video player
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && internalPlayer.currentTime !== undefined) {
        const initialTime = internalPlayer.currentTime || 0;
        setStoreTime(initialTime);
      }
    }
  };

  // Recalculate video bounds on resize
  useEffect(() => {
    const handleResize = () => {
      if (isVideoReady) {
        setTimeout(() => {
          const bounds = calculateVideoBounds(playerRef, videoContainerRef);
          if (bounds) {
            setVideoBounds(bounds);
          }
        }, VIDEO_CONFIG.RESIZE_DELAY);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVideoReady]);

  // Force timeline update when video becomes ready
  useEffect(() => {
    if (isVideoReady && playerRef.current && duration > 0) {
      const currentState = playerRef.current.getCurrentTime();
      if (currentState !== undefined) {
        setStoreTime(currentState);
      }
    }
  }, [isVideoReady, duration, setStoreTime]);

  const handleProgress = (state: any) => {
    const preciseTime = state.playedSeconds || 0;
    setStoreTime(preciseTime);
  };

  const handleDuration = (dur: number) => {
    setStoreDuration(dur);
  };

  return {
    playerRef,
    videoContainerRef,
    frameStripRef,
    isVideoReady,
    thumbnails,
    videoBounds,
    handleReady,
    handleProgress,
    handleDuration,
  };
};
