/**
 * GhostCut Video Editor - Main Component
 * Refactored for maintainability and code quality
 */

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useEffectsStore } from '../../store/effectsStore';
import { clampTime, handleTimelineInteraction as timelineInteractionUtil } from '../../utils/timelineUtils';

// Types
import { GhostCutVideoEditorProps } from './GhostCut/types';

// Hooks
import { useVideoSetup } from './GhostCut/hooks/useVideoSetup';
import { useEffectManagement } from './GhostCut/hooks/useEffectManagement';
import { useTimelineInteraction } from './GhostCut/hooks/useTimelineInteraction';
import { useKeyboardShortcuts } from './GhostCut/hooks/useKeyboardShortcuts';
import { useSubmission } from './GhostCut/hooks/useSubmission';

// Components
import { EditorHeader } from './GhostCut/components/header/EditorHeader';
import { VideoPlayer } from './GhostCut/components/video/VideoPlayer';
import { EffectOverlays } from './GhostCut/components/video/EffectOverlays';
import { TimelineControls } from './GhostCut/components/timeline/TimelineControls';
import { TimelineRuler } from './GhostCut/components/timeline/TimelineRuler';
import { FrameStrip } from './GhostCut/components/timeline/FrameStrip';
import { TimelineEffects } from './GhostCut/components/timeline/TimelineEffects';

const GhostCutVideoEditor: React.FC<GhostCutVideoEditorProps> = ({
  videoUrl,
  videoFile,
  onBack,
}) => {
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Get all state and actions from centralized store
  const {
    effects,
    addEffect,
    updateEffect,
    deleteEffect,
    currentTime,
    duration,
    isPlaying,
    zoomLevel: timelineZoom,
    setCurrentTime: setStoreTime,
    setDuration: setStoreDuration,
    setIsPlaying: setStoreIsPlaying,
    setZoomLevel: setTimelineZoom,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEffectsStore();

  // Audio file debug logging
  useEffect(() => {
    console.log('AudioFile state updated:', audioFile);
  }, [audioFile]);

  // Video setup hook
  const {
    playerRef,
    videoContainerRef,
    frameStripRef,
    isVideoReady,
    thumbnails,
    videoBounds,
    handleReady,
    handleProgress,
    handleDuration,
  } = useVideoSetup({
    videoUrl,
    duration,
    setStoreTime,
    setStoreDuration,
  });

  // Effect management hook
  const {
    timelineEffects,
    isDrawingMode,
    currentRect,
    setCurrentRect,
    selectedType,
    editingEffectId,
    handleAddEffect,
    handleSaveRect,
    handleCancelDrawing,
    handleDeleteTimelineEffect,
    handleEffectClick,
    handleStopEditing,
  } = useEffectManagement({
    effects,
    addEffect,
    updateEffect,
    deleteEffect,
    currentTime,
    duration,
  });

  // Video control handlers
  const handlePlayPause = () => {
    setStoreIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current && duration > 0) {
      const clampedTime = clampTime(time, duration);
      setStoreTime(clampedTime);
      const seekPercentage = clampedTime / duration;
      playerRef.current.seekTo(seekPercentage, 'fraction');
    }
  };

  // Timeline interaction hook
  const {
    isDragging,
    isDraggingTimeline,
    setIsDraggingTimeline,
    handleTimelineEffectDrag,
    handleTimelineRulerDrag,
  } = useTimelineInteraction({
    duration,
    timelineZoom,
    effects,
    updateEffect,
    handleSeek,
  });

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    undo,
    redo,
    canUndo,
    canRedo,
  });

  // Submission hook
  const { isSubmitting, submissionProgress, handleSubmit } = useSubmission({
    videoFile,
    audioFile,
    effects,
  });

  // Timeline drag handlers
  const createTimelineDragHandler = (containerRef: React.RefObject<HTMLDivElement | null>) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTimeline(true);

    const timelineContainer = containerRef.current;
    if (!timelineContainer) {
      setIsDraggingTimeline(false);
      return;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newTime = timelineInteractionUtil(
        moveEvent,
        timelineContainer,
        duration,
        timelineZoom
      );
      handleSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingTimeline(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <EditorHeader
        onBack={onBack}
        audioFile={audioFile}
        setAudioFile={setAudioFile}
        isSubmitting={isSubmitting}
        submissionProgress={submissionProgress}
        onSubmit={handleSubmit}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Video and Timeline Section */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Video Player Container */}
          <VideoPlayer
            playerRef={playerRef}
            videoContainerRef={videoContainerRef}
            videoUrl={videoUrl}
            isPlaying={isPlaying}
            isMuted={isMuted}
            onReady={handleReady}
            onProgress={handleProgress}
            onDuration={handleDuration}
            setStoreTime={setStoreTime}
            onStopEditing={handleStopEditing}
          >
            <EffectOverlays
              videoBounds={videoBounds}
              isDrawingMode={isDrawingMode}
              currentRect={currentRect}
              setCurrentRect={setCurrentRect}
              selectedType={selectedType}
              currentTime={currentTime}
              duration={duration}
              onSaveRect={handleSaveRect}
              onCancelDrawing={handleCancelDrawing}
              effects={effects}
              editingEffectId={editingEffectId}
              onUpdateEffect={updateEffect}
              onDeleteEffect={deleteEffect}
              onSetEditingEffect={(id) => id ? handleEffectClick(id, {} as React.MouseEvent) : handleStopEditing()}
            />
          </VideoPlayer>

          {/* Timeline Controls */}
          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              borderTop: '2px solid #e0e0e0',
              overflow: 'auto',
              minHeight: '45%',
              maxHeight: '45%',
            }}
          >
            <TimelineControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              timelineZoom={timelineZoom}
              canUndo={canUndo()}
              canRedo={canRedo()}
              onPlayPause={handlePlayPause}
              onVolumeToggle={handleVolumeToggle}
              onAddEffect={handleAddEffect}
              onUndo={undo}
              onRedo={redo}
              onZoomChange={setTimelineZoom}
            />

            {/* Video Frames Timeline */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white',
                overflow: 'hidden',
                minHeight: '300px',
              }}
            >
              <TimelineRuler
                duration={duration}
                currentTime={currentTime}
                timelineZoom={timelineZoom}
                isVideoReady={isVideoReady}
                isDraggingTimeline={isDraggingTimeline}
                onSeek={handleSeek}
                onDragStart={createTimelineDragHandler({ current: document.querySelector('[data-timeline-ruler]') as HTMLDivElement })}
              />

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'auto',
                }}
              >
                <FrameStrip
                  frameStripRef={frameStripRef}
                  thumbnails={thumbnails}
                  duration={duration}
                  currentTime={currentTime}
                  timelineZoom={timelineZoom}
                  isVideoReady={isVideoReady}
                  isDraggingTimeline={isDraggingTimeline}
                  onSeek={handleSeek}
                  onDragStart={createTimelineDragHandler(frameStripRef)}
                />

                <TimelineEffects
                  timelineEffects={timelineEffects}
                  duration={duration}
                  currentTime={currentTime}
                  timelineZoom={timelineZoom}
                  isVideoReady={isVideoReady}
                  editingEffectId={editingEffectId}
                  onEffectDrag={(e, id, type) => handleTimelineEffectDrag(e, id, type, frameStripRef)}
                  onEffectClick={handleEffectClick}
                  onDeleteEffect={handleDeleteTimelineEffect}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GhostCutVideoEditor;
