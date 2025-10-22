import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffectsStore } from '../../../store/effectsStore';
import { useSegmentsStore } from '../../../store/segmentsStore';

// Import types
import type { ProVideoEditorProps, TimelineEffect } from './types';

// Import hooks
import { useAutoLogin } from './hooks/useAutoLogin';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useEffectDrawing } from './hooks/useEffectDrawing';
import { useVideoThumbnails } from './hooks/useVideoThumbnails';
import { useVideoBounds } from './hooks/useVideoBounds';
import { useTimelineInteraction } from './hooks/useTimelineInteraction';
import { useVideoSubmission } from './hooks/useVideoSubmission';

// Import components
import {
  EditorHeader,
  VideoPlayerContainer,
  DrawingRectangle,
  EffectOverlay,
  TimelineControls,
  TimeRuler,
  FrameStrip,
  TimelineEffectsTrack
} from './components';

import SegmentDialog from './SegmentDialog';
import { syncTimelineEffects } from './utils/effectHelpers';

const ProVideoEditor: React.FC<ProVideoEditorProps> = ({
  videoUrl,
  videoFile,
  onBack
}) => {
  const navigate = useNavigate();
  const frameStripRef = useRef<HTMLDivElement | null>(null);

  // Initialize auto-login
  useAutoLogin();

  // Local orchestration state
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [timelineEffects, setTimelineEffects] = useState<TimelineEffect[]>([]);
  const [timelineZoom, setTimelineZoom] = useState(1);

  // Stores
  const {
    effects,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteEffect,
  } = useEffectsStore();

  const {
    segments,
    setVideoFile,
    getSegmentCount
  } = useSegmentsStore();

  // Custom hooks
  const videoPlayer = useVideoPlayer();
  const effectDrawing = useEffectDrawing();
  const thumbnails = useVideoThumbnails(videoUrl, videoPlayer.duration);
  const videoBounds = useVideoBounds(
    videoPlayer.playerRef,
    videoPlayer.videoContainerRef,
    videoPlayer.isVideoReady
  );
  const timelineInteraction = useTimelineInteraction(
    frameStripRef,
    videoPlayer.duration,
    timelineZoom
  );
  const submission = useVideoSubmission(videoFile);

  // Segment dialog handlers
  const handleAddSegment = () => {
    setEditingSegmentId(null);
    setIsSegmentDialogOpen(true);
  };

  const handleEditSegment = (segmentId: string) => {
    setEditingSegmentId(segmentId);
    setIsSegmentDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsSegmentDialogOpen(false);
    setEditingSegmentId(null);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  // Sync timeline effects (combine effects and segments)
  useEffect(() => {
    setTimelineEffects(
      syncTimelineEffects(effects, segments, videoPlayer.duration)
    );
  }, [effects, segments, videoPlayer.duration]);

  // Keyboard shortcuts (Ctrl+Z/Ctrl+Y for undo/redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Initialize video file in segments store
  useEffect(() => {
    if (videoFile && videoPlayer.duration > 0) {
      setVideoFile(videoFile, videoPlayer.duration);
    } else if (videoUrl && videoPlayer.duration > 0) {
      // For URL-based videos, create a placeholder File object
      const placeholderFile = new File([], 'video.mp4', { type: 'video/mp4' });
      setVideoFile(placeholderFile, videoPlayer.duration);
    }
  }, [videoFile, videoUrl, videoPlayer.duration, setVideoFile]);

  // Auto-scroll timeline to keep playhead visible
  useEffect(() => {
    if (frameStripRef.current && videoPlayer.isPlaying) {
      const scrollContainer = frameStripRef.current;
      const playheadPosition = (videoPlayer.currentTime / videoPlayer.duration) * scrollContainer.scrollWidth;
      const containerWidth = scrollContainer.clientWidth;
      const scrollLeft = scrollContainer.scrollLeft;

      if (playheadPosition < scrollLeft || playheadPosition > scrollLeft + containerWidth) {
        scrollContainer.scrollLeft = Math.max(0, playheadPosition - containerWidth / 2);
      }
    }
  }, [videoPlayer.currentTime, videoPlayer.isPlaying, videoPlayer.duration]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1e1e1e',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <EditorHeader
        canUndo={canUndo}
        canRedo={canRedo}
        segmentCount={getSegmentCount()}
        isSubmitting={submission.isSubmitting}
        onBack={handleBackClick}
        onUndo={undo}
        onRedo={redo}
        onAddSegment={handleAddSegment}
        onSubmit={submission.handleSubmit}
      />

      {/* Video Player Container */}
      <VideoPlayerContainer
        videoUrl={videoUrl}
        playerRef={videoPlayer.playerRef}
        containerRef={videoBounds.containerRef}
        isPlaying={videoPlayer.isPlaying}
        isMuted={videoPlayer.isMuted}
        volume={videoPlayer.volume}
        playedSeconds={videoPlayer.playedSeconds}
        onProgress={videoPlayer.handleProgress}
        onDuration={videoPlayer.handleDuration}
        onReady={videoBounds.updateVideoBounds}
        onPlayPause={videoPlayer.togglePlayPause}
        onMuteToggle={videoPlayer.toggleMute}
        onVolumeChange={videoPlayer.handleVolumeChange}
      >
        {/* Drawing Rectangle */}
        <DrawingRectangle
          isDrawing={effectDrawing.isDrawing}
          drawRect={effectDrawing.drawRect}
          drawStartPos={effectDrawing.drawStartPos}
          onMouseDown={effectDrawing.handleMouseDown}
          onMouseMove={effectDrawing.handleMouseMove}
          onMouseUp={effectDrawing.handleMouseUp}
        />

        {/* Effect Overlays */}
        <EffectOverlay
          effects={effects}
          currentTime={videoPlayer.currentTime}
          videoBounds={videoBounds.videoBounds}
          onDelete={deleteEffect}
        />
      </VideoPlayerContainer>

      {/* Timeline Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#2a2a2a',
          borderTop: '1px solid #444',
          overflow: 'hidden',
        }}
      >
        {/* Timeline Controls */}
        <TimelineControls
          currentTime={videoPlayer.currentTime}
          duration={videoPlayer.duration}
          timelineZoom={timelineZoom}
          onZoomChange={setTimelineZoom}
        />

        {/* Time Ruler */}
        <TimeRuler
          duration={videoPlayer.duration}
          timelineZoom={timelineZoom}
        />

        {/* Frame Strip with Playhead */}
        <FrameStrip
          ref={frameStripRef}
          thumbnails={thumbnails.thumbnails}
          currentTime={videoPlayer.currentTime}
          duration={videoPlayer.duration}
          timelineZoom={timelineZoom}
          isDraggingPlayhead={timelineInteraction.isDraggingPlayhead}
          onMouseDown={timelineInteraction.handleTimelineMouseDown}
          onMouseMove={timelineInteraction.handleTimelineMouseMove}
          onMouseUp={timelineInteraction.handleTimelineMouseUp}
        />

        {/* Timeline Effects Track */}
        <TimelineEffectsTrack
          timelineEffects={timelineEffects}
          duration={videoPlayer.duration}
          timelineZoom={timelineZoom}
          onEditSegment={handleEditSegment}
        />
      </Box>

      {/* Segment Dialog */}
      <SegmentDialog
        open={isSegmentDialogOpen}
        onClose={handleCloseDialog}
        editingSegmentId={editingSegmentId}
        videoUrl={videoUrl}
        videoFile={videoFile}
        videoDuration={videoPlayer.duration}
      />
    </Box>
  );
};

export default ProVideoEditor;
