/**
 * Video Player component for GhostCut Editor
 */

import React from 'react';
import { Box } from '@mui/material';
import ReactPlayer from 'react-player';
import { VIDEO_CONFIG } from '../../constants/editorConstants';

interface VideoPlayerProps {
  playerRef: React.RefObject<any>;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  videoUrl: string;
  isPlaying: boolean;
  isMuted: boolean;
  onReady: () => void;
  onProgress: (state: any) => void;
  onDuration: (duration: number) => void;
  setStoreTime: (time: number) => void;
  onStopEditing: () => void;
  children?: React.ReactNode;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playerRef,
  videoContainerRef,
  videoUrl,
  isPlaying,
  isMuted,
  onReady,
  onProgress,
  onDuration,
  setStoreTime,
  onStopEditing,
  children,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '55%',
        bgcolor: '#000',
        p: 2,
      }}
    >
      <Box
        ref={videoContainerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onStopEditing();
          }
        }}
        sx={{
          width: '100%',
          maxWidth: `${VIDEO_CONFIG.MAX_VIDEO_WIDTH}px`,
          height: '100%',
          bgcolor: 'black',
          position: 'relative',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={isPlaying}
          muted={isMuted}
          width="100%"
          height="100%"
          onReady={onReady}
          onProgress={onProgress}
          onDuration={onDuration}
          onSeek={(seconds: number) => {
            setStoreTime(seconds);
          }}
          onError={(error: any) => {
            console.error('Video playback error:', error);
          }}
          progressInterval={VIDEO_CONFIG.PROGRESS_INTERVAL}
          controls={false}
        />
        {children}
      </Box>
    </Box>
  );
};
