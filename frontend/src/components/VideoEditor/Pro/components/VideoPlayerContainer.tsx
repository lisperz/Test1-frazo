import React from 'react';
import ReactPlayer from 'react-player';
import { Box } from '@mui/material';

interface VideoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoPlayerContainerProps {
  videoUrl: string;
  playerRef: React.RefObject<ReactPlayer>;
  videoContainerRef: React.RefObject<HTMLDivElement>;
  isPlaying: boolean;
  isMuted: boolean;
  onReady: () => void;
  onProgress: (state: any) => void;
  onDuration: (duration: number) => void;
  onSeek: (seconds: number) => void;
  onError: (error: any) => void;
  onStopEditing: () => void;
  videoBounds: VideoBounds | null;
  children?: React.ReactNode;
}

const VideoPlayerContainer: React.FC<VideoPlayerContainerProps> = ({
  videoUrl,
  playerRef,
  videoContainerRef,
  isPlaying,
  isMuted,
  onReady,
  onProgress,
  onDuration,
  onSeek,
  onError,
  onStopEditing,
  videoBounds,
  children,
}) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '55%',
      bgcolor: '#000',
      p: 2
    }}>
      <Box
        ref={videoContainerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onStopEditing();
          }
        }}
        sx={{
          width: '100%',
          maxWidth: '900px',
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
          onSeek={onSeek}
          onError={onError}
          progressInterval={50}
          controls={false}
        />

        {/* Video bounds container for proper constraint */}
        {videoBounds && (
          <Box
            className="video-bounds-container"
            sx={{
              position: 'absolute',
              left: videoBounds.x,
              top: videoBounds.y,
              width: videoBounds.width,
              height: videoBounds.height,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {children}
      </Box>
    </Box>
  );
};

export default VideoPlayerContainer;
