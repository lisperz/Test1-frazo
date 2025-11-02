import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import ReactPlayer from 'react-player';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Pause,
  Delete,
  Close,
  Undo,
  Redo,
  VolumeUp,
  VolumeOff,
  Add,
} from '@mui/icons-material';
import { useEffectsStore, VideoEffect } from '../../../store/effectsStore';
import { useNavigate } from 'react-router-dom';
import { calculateProgressPercentage, formatTime as formatTimeUtil, clampTime, handleTimelineInteraction } from '../../../utils/timelineUtils';
import { useSegmentsStore } from '../../../store/segmentsStore';
import SegmentDialog from './SegmentDialog';
import { API_ENDPOINTS } from './constants/editorConstants';

interface ProVideoEditorProps {
  videoUrl: string;
  videoFile: File | null;
  onBack?: () => void;
}

interface TimelineEffect {
  id: string;
  type: 'erasure' | 'protection' | 'text';
  startFrame: number;
  endFrame: number;
  color: string;
  label: string;
}

const ProVideoEditor: React.FC<ProVideoEditorProps> = ({ 
  videoUrl, 
  videoFile, 
  onBack 
}) => {
  const navigate = useNavigate();
  const playerRef = useRef<ReactPlayer>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const frameStripRef = useRef<HTMLDivElement>(null);
  
  // Local component state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [timelineEffects, setTimelineEffects] = useState<TimelineEffect[]>([]);
  const [videoBounds, setVideoBounds] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentRect, setCurrentRect] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'erasure' | 'protection' | 'text'>('erasure');
  
  // Edit mode state for existing effects
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);
  
  // Timeline interaction state
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState('');

  // Segment dialog state
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  // Get segments store with undo/redo
  const {
    segments,
    setVideoFile: setStoreVideoFile,
    getSegmentCount,
    deleteSegment,
    updateSegment,
    currentSegmentId,
    undo: undoSegment,
    redo: redoSegment,
    canUndo: canUndoSegment,
    canRedo: canRedoSegment,
  } = useSegmentsStore();

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

  // Debug log for segments state
  useEffect(() => {
    console.log('=== SEGMENTS STATE CHANGED ===');
    console.log('Total segments:', segments.length);
    console.log('Segments:', segments);
  }, [segments]);

  // Synchronize timeline effects with main effects store AND segments
  useEffect(() => {
    // Map video effects (erasure, protection, text)
    const syncedTimelineEffects: TimelineEffect[] = effects.map(effect => {
      const colors = {
        erasure: '#5B8FF9',
        protection: '#5AD8A6',
        text: '#5D7092',
      };

      const labels = {
        erasure: 'Erasure Area',
        protection: 'Protection Area',
        text: 'Erase Text',
      };

      return {
        id: effect.id,
        type: effect.type,
        // Use precise percentage calculation without rounding
        startFrame: (effect.startTime / duration) * 100,
        endFrame: (effect.endTime / duration) * 100,
        color: colors[effect.type],
        label: labels[effect.type],
      };
    });

    // Add segments to timeline effects
    const segmentEffects: TimelineEffect[] = segments.map((segment, index) => ({
      id: segment.id,
      type: 'text' as const, // Use 'text' type so it's compatible with TimelineEffect type
      startFrame: (segment.startTime / duration) * 100,
      endFrame: (segment.endTime / duration) * 100,
      color: segment.color,
      label: segment.label || `Segment ${index + 1}`,
    }));

    // Combine effects and segments
    setTimelineEffects([...syncedTimelineEffects, ...segmentEffects]);
  }, [effects, segments, duration]); // Sync whenever effects, segments, or duration changes

  // Keyboard shortcuts for undo/redo and delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle undo/redo shortcuts (Ctrl+Z / Ctrl+Y)
      if ((event.ctrlKey || event.metaKey)) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          // Try to undo segments first, then effects
          if (canUndoSegment()) {
            console.log('🔄 Undoing segment operation');
            undoSegment();
          } else if (canUndo()) {
            console.log('🔄 Undoing effect operation');
            undo();
          }
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          // Try to redo segments first, then effects
          if (canRedoSegment()) {
            console.log('🔄 Redoing segment operation');
            redoSegment();
          } else if (canRedo()) {
            console.log('🔄 Redoing effect operation');
            redo();
          }
        }
      }

      // Handle Delete key for segments and effects
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Check if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return; // Don't intercept delete in input fields
        }

        event.preventDefault();

        // Delete currently selected segment instantly (no confirmation)
        if (currentSegmentId) {
          console.log('🗑️ Deleting segment via keyboard:', currentSegmentId);
          deleteSegment(currentSegmentId);
        }
        // Delete currently editing effect instantly
        else if (editingEffectId) {
          console.log('🗑️ Deleting effect via keyboard:', editingEffectId);
          deleteEffect(editingEffectId);
          setEditingEffectId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo, redo, canUndo, canRedo,
    undoSegment, redoSegment, canUndoSegment, canRedoSegment,
    deleteSegment, currentSegmentId, editingEffectId, deleteEffect
  ]);

  // Initialize video in segments store when component mounts
  useEffect(() => {
    if (videoFile && videoUrl && duration > 0) {
      setStoreVideoFile(videoFile, videoUrl, duration);
    }
  }, [videoFile, videoUrl, duration, setStoreVideoFile]);

  // Segment dialog handlers
  const handleAddSegment = () => {
    console.log('=== ADD SEGMENT BUTTON CLICKED ===');
    console.log('Opening segment dialog');
    setEditingSegmentId(null);
    setIsSegmentDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log('=== CLOSING SEGMENT DIALOG ===');
    setIsSegmentDialogOpen(false);
    setEditingSegmentId(null);
  };

  // Auto-login function to ensure user is authenticated
  useEffect(() => {
    const autoLogin = async () => {
      // Check if we already have a valid token
      const existingToken = localStorage.getItem('access_token');
      if (existingToken) {
        // Try to verify the token by making a test request
        try {
          const response = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${existingToken}`
            }
          });
          if (response.ok) {
            console.log('Already authenticated');
            return; // Token is valid, no need to login
          }
        } catch (error) {
          console.log('Existing token invalid, logging in...');
        }
      }

      // Auto-login with demo account
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'demo@example.com',
            password: 'demo123'
          })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          console.log('Auto-login successful for demo@example.com');
        } else {
          console.error('Auto-login failed');
        }
      } catch (error) {
        console.error('Auto-login error:', error);
      }
    };

    autoLogin();
  }, []); // Run once on component mount

  // Generate video thumbnails
  useEffect(() => {
    if (videoUrl && playerRef.current && duration > 0) {
      generateThumbnails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, duration]);

  const generateThumbnails = async () => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameCount = 30; // Number of thumbnails to generate
    const interval = video.duration / frameCount;
    const thumbs: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      video.currentTime = i * interval;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      canvas.width = 120;
      canvas.height = 68;
      ctx.drawImage(video, 0, 0, 120, 68);
      thumbs.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    setThumbnails(thumbs);
  };

  // Calculate actual video display bounds within the container
  const calculateVideoBounds = () => {
    if (!playerRef.current || !videoContainerRef.current) return null;
    
    const internalPlayer = playerRef.current.getInternalPlayer();
    if (!internalPlayer || !internalPlayer.videoWidth || !internalPlayer.videoHeight) return null;
    
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
      height: videoDisplayHeight
    };
  };

  const handleReady = () => {
    console.log('Video ready');
    setIsVideoReady(true);
    
    // Calculate video bounds
    setTimeout(() => {
      const bounds = calculateVideoBounds();
      if (bounds) {
        setVideoBounds(bounds);
      }
    }, 100); // Small delay to ensure video dimensions are available
    
    // Get initial time from the video player
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && internalPlayer.currentTime !== undefined) {
        const initialTime = internalPlayer.currentTime || 0;
        // Only update the central store
        setStoreTime(initialTime);
      }
    }
  };

  const handleProgress = (state: any) => {
    // Use the most precise time available from ReactPlayer
    const preciseTime = state.playedSeconds || 0;
    // Update only the central store to maintain single source of truth
    setStoreTime(preciseTime);
  };

  const handleDuration = (dur: number) => {
    // Update only the central store
    setStoreDuration(dur);
  };

  const handlePlayPause = () => {
    setStoreIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current && duration > 0) {
      // Use utility function for clamping
      const clampedTime = clampTime(time, duration);
      // Update only the central store
      setStoreTime(clampedTime);
      
      // Seek the player with high precision
      const seekPercentage = clampedTime / duration;
      playerRef.current.seekTo(seekPercentage, 'fraction');
    }
  };


  const handleAddEffect = (type: 'erasure' | 'protection' | 'text') => {
    setSelectedType(type);
    setIsDrawingMode(true);
    
    // Create a default rectangle
    setCurrentRect({
      x: 0.3,
      y: 0.3,
      width: 0.4,
      height: 0.4,
    });
  };

  const handleSaveRect = () => {
    if (!currentRect) return;

    const startTime = currentTime;
    const endTime = Math.min(currentTime + 5, duration);
    
    const newEffect: VideoEffect = {
      id: `effect_${Date.now()}`,
      type: selectedType,
      startTime,
      endTime,
      region: currentRect,
    };

    addEffect(newEffect);
    // Timeline effects will be automatically synchronized via useEffect
    
    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  const handleCancelDrawing = () => {
    setCurrentRect(null);
    setIsDrawingMode(false);
  };

  const handleTimelineEffectDrag = (
    e: React.MouseEvent,
    effectId: string,
    type: 'start' | 'end' | 'move'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(effectId);

    // Check if this is a segment or an effect
    const isSegment = segments.some(seg => seg.id === effectId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!frameStripRef.current) return;

      // Use centralized timeline interaction for precise calculation
      const newTime = handleTimelineInteraction(
        moveEvent,
        frameStripRef.current,
        duration,
        timelineZoom
      );

      if (isSegment) {
        // Handle segment resizing - update both segment and audio times
        const segment = segments.find(seg => seg.id === effectId);
        if (segment) {
          if (type === 'start') {
            const maxStartTime = segment.endTime - 0.5; // Minimum 0.5s duration for segments
            const newStartTime = Math.max(0, Math.min(newTime, maxStartTime));

            // Calculate audio duration change
            const segmentDurationChange = newStartTime - segment.startTime;

            // Update segment with new start time and adjusted audio times
            updateSegment(effectId, {
              startTime: newStartTime,
              audioInput: {
                ...segment.audioInput,
                // Keep audio in sync with segment
                startTime: segment.audioInput.startTime !== undefined
                  ? Math.max(0, segment.audioInput.startTime + segmentDurationChange)
                  : undefined,
              }
            });
          } else if (type === 'end') {
            const minEndTime = segment.startTime + 0.5; // Minimum 0.5s duration for segments
            const newEndTime = Math.min(duration, Math.max(minEndTime, newTime));

            // Calculate audio duration change
            const segmentDurationChange = newEndTime - segment.endTime;

            // Update segment with new end time and adjusted audio times
            updateSegment(effectId, {
              endTime: newEndTime,
              audioInput: {
                ...segment.audioInput,
                // Keep audio in sync with segment
                endTime: segment.audioInput.endTime !== undefined
                  ? Math.max(0, segment.audioInput.endTime + segmentDurationChange)
                  : undefined,
              }
            });
          } else if (type === 'move') {
            const segmentDuration = segment.endTime - segment.startTime;
            // Center the drag on the mouse position
            const newStartTime = clampTime(newTime - segmentDuration / 2, duration - segmentDuration);
            const newEndTime = newStartTime + segmentDuration;

            // Calculate how much the segment moved
            const segmentTimeShift = newStartTime - segment.startTime;

            // Move segment and shift audio times by the same amount
            updateSegment(effectId, {
              startTime: newStartTime,
              endTime: newEndTime,
              audioInput: {
                ...segment.audioInput,
                // Shift audio times to stay in sync with segment
                startTime: segment.audioInput.startTime !== undefined
                  ? Math.max(0, segment.audioInput.startTime + segmentTimeShift)
                  : undefined,
                endTime: segment.audioInput.endTime !== undefined
                  ? Math.max(0, segment.audioInput.endTime + segmentTimeShift)
                  : undefined,
              }
            });
          }
        }
      } else {
        // Handle effect (annotation) resizing - original logic
        const effect = effects.find(e => e.id === effectId);
        if (effect) {
          if (type === 'start') {
            const maxStartTime = effect.endTime - 0.1; // Minimum 0.1s duration
            const newStartTime = Math.min(newTime, maxStartTime);
            updateEffect(effectId, { startTime: newStartTime });
          } else if (type === 'end') {
            const minEndTime = effect.startTime + 0.1; // Minimum 0.1s duration
            const newEndTime = Math.max(minEndTime, newTime);
            updateEffect(effectId, { endTime: clampTime(newEndTime, duration) });
          } else if (type === 'move') {
            const effectDuration = effect.endTime - effect.startTime;
            // Center the drag on the mouse position
            const newStartTime = clampTime(newTime - effectDuration / 2, duration - effectDuration);
            const newEndTime = newStartTime + effectDuration;
            updateEffect(effectId, {
              startTime: newStartTime,
              endTime: newEndTime
            });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDeleteTimelineEffect = (id: string) => {
    // Check if this is a segment or an effect
    const isSegment = segments.some(seg => seg.id === id);

    if (isSegment) {
      // Delete segment instantly without confirmation (like effects)
      deleteSegment(id);
      console.log('🗑️ Deleted segment from timeline:', id);
    } else {
      // Delete effect instantly
      deleteEffect(id);
      console.log('🗑️ Deleted effect from timeline:', id);
    }
    // Timeline effects will be automatically synchronized via useEffect
  };


  const handleEffectClick = (effectId: string, e: React.MouseEvent) => {
    // Only handle clicks that are not on drag handles or delete button
    if ((e.target as HTMLElement).closest('[data-drag-handle]') ||
        (e.target as HTMLElement).closest('button')) {
      return;
    }

    // Check if this is a segment (from segments store)
    const isSegment = segments.some(seg => seg.id === effectId);

    if (isSegment) {
      // This is a segment - set it as the current segment for deletion
      const { setCurrentSegment } = useSegmentsStore.getState();
      setCurrentSegment(effectId);
      console.log('📌 Selected segment for keyboard operations:', effectId);
    } else {
      // This is an effect - set it for editing
      setEditingEffectId(effectId);
      setIsDrawingMode(false); // Exit any current drawing mode
    }
  };

  const handleStopEditing = () => {
    setEditingEffectId(null);
  };

  // Use utility function for time formatting
  const formatTime = (seconds: number, includeMs: boolean = false): string => {
    if (includeMs) {
      return formatTimeUtil(seconds);
    }
    // For simple MM:SS format
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Use centralized calculation for progress percentage
  const progressPercentage = calculateProgressPercentage(currentTime, duration);
  
  // Debug logging and initial state sync
  useEffect(() => {
    console.log('Timeline Debug:', {
      currentTime,
      duration,
      progressPercentage,
      formatted: formatTime(currentTime),
      isVideoReady
    });
  }, [currentTime, duration, progressPercentage, isVideoReady]);
  
  // Force timeline update when video becomes ready
  useEffect(() => {
    if (isVideoReady && playerRef.current && duration > 0) {
      // Force a progress update to sync the timeline
      const currentState = playerRef.current.getCurrentTime();
      if (currentState !== undefined && currentState !== currentTime) {
        // Only update the central store
        setStoreTime(currentState);
      }
    }
  }, [isVideoReady, duration, currentTime, setStoreTime]);

  // Recalculate video bounds on container resize
  useEffect(() => {
    const handleResize = () => {
      if (isVideoReady) {
        setTimeout(() => {
          const bounds = calculateVideoBounds();
          if (bounds) {
            setVideoBounds(bounds);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVideoReady]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        px: 2,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: '48px'
      }}>
        <IconButton onClick={onBack || (() => navigate(-1))} size="small">
          <ArrowBack />
        </IconButton>
        <Typography sx={{ fontSize: '14px', color: '#666' }}>
          Pro Video Editor - Multi-Segment Lip Sync
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Show segment count indicator */}
        {segments.length > 0 && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            bgcolor: '#f0f9ff',
            borderRadius: 1,
            border: '1px solid #bae6fd'
          }}>
            <Typography sx={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
              {segments.length} segment{segments.length > 1 ? 's' : ''} configured
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '13px', color: '#999' }}>
          Pro Version
        </Typography>
        <Button
          variant="contained"
          size="small"
          disabled={isSubmitting || segments.length === 0}
          onClick={async () => {
            console.log('=== PRO VIDEO SUBMIT HANDLER ===');
            console.log('Segments count:', segments.length);
            console.log('Segments data:', segments);
            console.log('Effects count:', effects.length);
            console.log('Video file:', videoFile);

            if (!videoFile) {
              console.error('No video file available for submission');
              alert('Please upload a video file');
              return;
            }

            if (segments.length === 0) {
              console.error('No segments configured - segments array is empty!');
              alert('Please add at least one segment for Pro video processing');
              return;
            }

            setIsSubmitting(true);
            setSubmissionProgress('Preparing Pro video for processing...');

            try {
              console.log('Submitting Pro video with', segments.length, 'segments');

              const formData = new FormData();
              formData.append('file', videoFile);
              formData.append('display_name', `Pro Video - ${videoFile.name}`);

              // Add only UNIQUE audio files (deduplicate by refId)
              // This is important when the same audio file is reused across multiple segments
              const uniqueAudioMap = new Map<string, File>();
              segments.forEach(seg => {
                if (seg.audioInput.file && !uniqueAudioMap.has(seg.audioInput.refId)) {
                  uniqueAudioMap.set(seg.audioInput.refId, seg.audioInput.file);
                }
              });

              // Append unique audio files in the order their refIds appear
              uniqueAudioMap.forEach((file) => {
                formData.append('audio_files', file);
              });

              console.log('Including', uniqueAudioMap.size, 'unique audio files for', segments.length, 'segments');
              console.log('Unique audio refIds:', Array.from(uniqueAudioMap.keys()));
              console.log('RAW SEGMENTS FROM STORE:', JSON.stringify(segments, null, 2));

              // Build segments data for API
              const segmentsData = segments.map(seg => {
                // Per Sync.so docs: audioInput times are OPTIONAL
                // Only include when user explicitly enables audio cropping
                // Omitting allows default "remap" sync_mode to handle duration mismatch
                const audioInput: any = {
                  refId: seg.audioInput.refId
                };

                // Only include audio crop times if both are explicitly set by user
                if (seg.audioInput.startTime !== null && seg.audioInput.startTime !== undefined &&
                    seg.audioInput.endTime !== null && seg.audioInput.endTime !== undefined) {
                  audioInput.startTime = seg.audioInput.startTime;
                  audioInput.endTime = seg.audioInput.endTime;
                }

                return {
                  startTime: seg.startTime,
                  endTime: seg.endTime,
                  audioInput
                };
              });

              formData.append('segments_data', JSON.stringify(segmentsData));
              console.log('Segments configuration:', JSON.stringify(segmentsData, null, 2));

              // Include effects data if any
              if (effects.length > 0) {
                const effectsData = effects.map(effect => ({
                  type: effect.type,
                  startTime: effect.startTime,
                  endTime: effect.endTime,
                  region: effect.region
                }));
                formData.append('effects', JSON.stringify(effectsData));
                console.log('Including', effects.length, 'effects');
              }

              setSubmissionProgress('Uploading video and audio files for Pro processing...');

              // Get auth token
              const token = localStorage.getItem('access_token');
              if (!token) {
                console.error('No authentication token found');
                setIsSubmitting(false);
                setSubmissionProgress('');
                alert('Not authenticated. Please refresh the page and try again.');
                return;
              }

              const headers: Record<string, string> = {
                'Authorization': `Bearer ${token}`
              };

              console.log('Sending request to Pro API endpoint');

              const response = await fetch(API_ENDPOINTS.PRO_SYNC_PROCESS, {
                method: 'POST',
                headers,
                body: formData
              });

              console.log('Response status:', response.status);
              const result = await response.json();

              if (response.ok) {
                console.log('Pro video submitted successfully:', result);
                setSubmissionProgress('Pro job created successfully! Redirecting to jobs page...');

                // Immediately navigate to jobs page
                setTimeout(() => {
                  navigate('/jobs');
                }, 1500);
              } else {
                console.error('Submission failed:', result);
                setSubmissionProgress('');
                setIsSubmitting(false);

                if (response.status === 403) {
                  alert('Insufficient permissions. Pro tier subscription required.');
                } else {
                  alert(`Submission failed: ${result.detail || result.message || 'Unknown error'}`);
                }
              }
            } catch (error) {
              console.error('Error submitting Pro video:', error);
              setSubmissionProgress('');
              setIsSubmitting(false);
              alert('Error submitting video. Please try again.');
            }
          }}
          sx={{
            bgcolor: '#1890ff',
            fontSize: '13px',
            px: 3,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#40a9ff'
            },
            '&:disabled': {
              bgcolor: '#d9d9d9',
              color: '#999'
            }
          }}
        >
          {isSubmitting ? 'Processing...' : segments.length === 0 ? 'Add Segments' : 'Submit'}
        </Button>
      </Box>
      
      {/* Progress indicator for submission */}
      {isSubmitting && submissionProgress && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 2,
          gap: 2
        }}>
          <Box sx={{
            width: 16,
            height: 16,
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <Typography sx={{ 
            fontSize: '14px', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            {submissionProgress}
          </Typography>
        </Box>
      )}

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden'
      }}>
        {/* Video and Timeline Section */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
        
        {/* Video Player Container - Increased size */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '55%', // Increased to give more space to video player
          bgcolor: '#000',
          p: 2 // Increased padding for better visual balance
        }}>
          <Box 
            ref={videoContainerRef}
            onClick={(e) => {
              // If clicking on the video container (not on an effect), stop editing
              if (e.target === e.currentTarget) {
                handleStopEditing();
              }
            }}
            sx={{ 
              width: '100%',
              maxWidth: '900px', // Larger max width for bigger video display
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
            onReady={handleReady}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onSeek={(seconds: number) => {
              // Sync only to central store
              setStoreTime(seconds);
            }}
            onError={(error: any) => {
              console.error('Video playback error:', error);
            }}
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

          {/* Drawing Rectangle Overlay */}
          {isDrawingMode && currentRect && videoBounds && (
            <Rnd
              default={{
                x: videoBounds.x + (currentRect.x * videoBounds.width),
                y: videoBounds.y + (currentRect.y * videoBounds.height),
                width: currentRect.width * videoBounds.width,
                height: currentRect.height * videoBounds.height,
              }}
              bounds=".video-bounds-container"
              onDragStop={(e, d) => {
                if (videoBounds) {
                  setCurrentRect({
                    x: (d.x - videoBounds.x) / videoBounds.width,
                    y: (d.y - videoBounds.y) / videoBounds.height,
                    width: currentRect.width,
                    height: currentRect.height,
                  });
                }
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                if (videoBounds) {
                  setCurrentRect({
                    x: (position.x - videoBounds.x) / videoBounds.width,
                    y: (position.y - videoBounds.y) / videoBounds.height,
                    width: parseInt(ref.style.width) / videoBounds.width,
                    height: parseInt(ref.style.height) / videoBounds.height,
                  });
                }
              }}
              style={{
                border: `3px solid ${selectedType === 'erasure' ? '#5B8FF9' : selectedType === 'protection' ? '#5AD8A6' : '#5D7092'}`,
                backgroundColor: `${selectedType === 'erasure' ? 'rgba(91, 143, 249, 0.15)' : selectedType === 'protection' ? 'rgba(90, 216, 166, 0.15)' : 'rgba(93, 112, 146, 0.15)'}`,
                position: 'absolute',
                zIndex: 10,
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Corner dots for all effect types during drawing */}
              {(() => {
                const dotColor = selectedType === 'erasure' ? '#5B8FF9' :
                               selectedType === 'protection' ? '#5AD8A6' : '#5D7092';
                const hoverColor = selectedType === 'erasure' ? '#40a9ff' :
                                 selectedType === 'protection' ? '#52c41a' : '#434c5e';
                
                return (
                  <>
                    {/* Top-left corner dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -4,
                        top: -4,
                        width: 8,
                        height: 8,
                        backgroundColor: dotColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'nw-resize',
                        pointerEvents: 'auto',
                        '&:hover': {
                          backgroundColor: hoverColor,
                          transform: 'scale(1.2)',
                        }
                      }}
                    />
                    
                    {/* Top-right corner dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -4,
                        top: -4,
                        width: 8,
                        height: 8,
                        backgroundColor: dotColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'ne-resize',
                        pointerEvents: 'auto',
                        '&:hover': {
                          backgroundColor: hoverColor,
                          transform: 'scale(1.2)',
                        }
                      }}
                    />
                    
                    {/* Bottom-left corner dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -4,
                        bottom: -4,
                        width: 8,
                        height: 8,
                        backgroundColor: dotColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'sw-resize',
                        pointerEvents: 'auto',
                        '&:hover': {
                          backgroundColor: hoverColor,
                          transform: 'scale(1.2)',
                        }
                      }}
                    />
                    
                    {/* Bottom-right corner dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        right: -4,
                        bottom: -4,
                        width: 8,
                        height: 8,
                        backgroundColor: dotColor,
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'se-resize',
                        pointerEvents: 'auto',
                        '&:hover': {
                          backgroundColor: hoverColor,
                          transform: 'scale(1.2)',
                        }
                      }}
                    />
                  </>
                );
              })()}
              
              <Box sx={{
                position: 'absolute',
                top: -50,
                left: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}>
                {/* Time range display */}
                <Typography sx={{
                  fontSize: '10px',
                  color: '#fff',
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  px: 1,
                  py: 0.5,
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap'
                }}>
                  {formatTime(currentTime, true)} - {formatTime(Math.min(currentTime + 5, duration), true)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveRect}
                    sx={{ 
                      fontSize: '11px',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      bgcolor: '#52c41a',
                      '&:hover': { bgcolor: '#73d13d' }
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancelDrawing}
                    sx={{ 
                      fontSize: '11px',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      borderColor: '#ff4d4f',
                      color: '#ff4d4f',
                      '&:hover': { 
                        borderColor: '#ff7875',
                        color: '#ff7875'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Rnd>
          )}

          {/* Display existing rectangles - Sort by area to show smaller ones on top */}
          {effects.filter(e => 
            currentTime >= e.startTime && currentTime <= e.endTime
          ).sort((a, b) => {
            // Sort by area (larger areas first, so smaller ones appear on top)
            const areaA = a.region.width * a.region.height;
            const areaB = b.region.width * b.region.height;
            return areaB - areaA;
          }).map((effect, index) => {
            const isEditing = editingEffectId === effect.id;
            
            // If editing, use Rnd component for full functionality
            if (isEditing && videoBounds) {
              return (
                <Rnd
                  key={effect.id}
                  default={{
                    x: videoBounds.x + (effect.region.x * videoBounds.width),
                    y: videoBounds.y + (effect.region.y * videoBounds.height),
                    width: effect.region.width * videoBounds.width,
                    height: effect.region.height * videoBounds.height,
                  }}
                  bounds=".video-bounds-container"
                  onDragStop={(e, d) => {
                    if (videoBounds) {
                      const newRegion = {
                        x: (d.x - videoBounds.x) / videoBounds.width,
                        y: (d.y - videoBounds.y) / videoBounds.height,
                        width: effect.region.width,
                        height: effect.region.height,
                      };
                      updateEffect(effect.id, { region: newRegion });
                    }
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    if (videoBounds) {
                      const newRegion = {
                        x: (position.x - videoBounds.x) / videoBounds.width,
                        y: (position.y - videoBounds.y) / videoBounds.height,
                        width: parseInt(ref.style.width) / videoBounds.width,
                        height: parseInt(ref.style.height) / videoBounds.height,
                      };
                      updateEffect(effect.id, { region: newRegion });
                    }
                  }}
                  style={{
                    border: `2px solid ${
                      effect.type === 'erasure' ? '#5B8FF9' :
                      effect.type === 'protection' ? '#5AD8A6' : '#5D7092'
                    }`,
                    backgroundColor: `${
                      effect.type === 'erasure' ? 'rgba(91, 143, 249, 0.1)' :
                      effect.type === 'protection' ? 'rgba(90, 216, 166, 0.1)' : 
                      'rgba(93, 112, 146, 0.1)'
                    }`,
                    position: 'absolute',
                    zIndex: 20 - index, // Higher z-index for smaller/later effects
                    outline: '2px dashed #fff',
                    outlineOffset: '4px',
                  }}
                >
                  {/* Corner dots for editing all effect types */}
                  <>
                    {(() => {
                      const dotColor = effect.type === 'erasure' ? '#5B8FF9' :
                                     effect.type === 'protection' ? '#5AD8A6' : '#5D7092';
                      const hoverColor = effect.type === 'erasure' ? '#40a9ff' :
                                       effect.type === 'protection' ? '#52c41a' : '#434c5e';
                      
                      return (
                        <>
                          {/* Top-left corner dot */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -4,
                              top: -4,
                              width: 8,
                              height: 8,
                              backgroundColor: dotColor,
                              border: '2px solid white',
                              borderRadius: '50%',
                              cursor: 'nw-resize',
                              pointerEvents: 'auto',
                              '&:hover': {
                                backgroundColor: hoverColor,
                                transform: 'scale(1.2)',
                              }
                            }}
                          />
                          
                          {/* Top-right corner dot */}
                          <Box
                            sx={{
                              position: 'absolute',
                              right: -4,
                              top: -4,
                              width: 8,
                              height: 8,
                              backgroundColor: dotColor,
                              border: '2px solid white',
                              borderRadius: '50%',
                              cursor: 'ne-resize',
                              pointerEvents: 'auto',
                              '&:hover': {
                                backgroundColor: hoverColor,
                                transform: 'scale(1.2)',
                              }
                            }}
                          />
                          
                          {/* Bottom-left corner dot */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -4,
                              bottom: -4,
                              width: 8,
                              height: 8,
                              backgroundColor: dotColor,
                              border: '2px solid white',
                              borderRadius: '50%',
                              cursor: 'sw-resize',
                              pointerEvents: 'auto',
                              '&:hover': {
                                backgroundColor: hoverColor,
                                transform: 'scale(1.2)',
                              }
                            }}
                          />
                          
                          {/* Bottom-right corner dot */}
                          <Box
                            sx={{
                              position: 'absolute',
                              right: -4,
                              bottom: -4,
                              width: 8,
                              height: 8,
                              backgroundColor: dotColor,
                              border: '2px solid white',
                              borderRadius: '50%',
                              cursor: 'se-resize',
                              pointerEvents: 'auto',
                              '&:hover': {
                                backgroundColor: hoverColor,
                                transform: 'scale(1.2)',
                              }
                            }}
                          />
                        </>
                      );
                    })()}
                  </>
                  
                  {/* Delete button positioned on the right side away from corner dots */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEffect(effect.id);
                      setEditingEffectId(null);
                    }}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: -30,
                      transform: 'translateY(-50%)',
                      width: 24,
                      height: 24,
                      bgcolor: '#ff4d4f',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#ff7875',
                        transform: 'translateY(-50%) scale(1.1)',
                      },
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 20,
                    }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                  
                  {/* Edit mode controls */}
                  <Box sx={{
                    position: 'absolute',
                    top: -30,
                    left: 0,
                    display: 'flex',
                    gap: 1,
                  }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleStopEditing}
                      sx={{ 
                        fontSize: '11px',
                        minWidth: 'auto',
                        px: 1,
                        py: 0.5,
                        bgcolor: '#52c41a',
                        '&:hover': { bgcolor: '#73d13d' }
                      }}
                    >
                      Done
                    </Button>
                  </Box>
                </Rnd>
              );
            }
            
            // For non-editing effects, use static Box that can be clicked to enter edit mode
            if (!videoBounds) return null;
            
            return (
              <Box
                key={effect.id}
                sx={{
                  position: 'absolute',
                  left: `${videoBounds.x + (effect.region.x * videoBounds.width)}px`,
                  top: `${videoBounds.y + (effect.region.y * videoBounds.height)}px`,
                  width: `${effect.region.width * videoBounds.width}px`,
                  height: `${effect.region.height * videoBounds.height}px`,
                  border: `2px solid ${
                    effect.type === 'erasure' ? '#5B8FF9' :
                    effect.type === 'protection' ? '#5AD8A6' : '#5D7092'
                  }`,
                  backgroundColor: `${
                    effect.type === 'erasure' ? 'rgba(91, 143, 249, 0.1)' :
                    effect.type === 'protection' ? 'rgba(90, 216, 166, 0.1)' : 
                    'rgba(93, 112, 146, 0.1)'
                  }`,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 15 - index, // Higher z-index for smaller/later effects
                  '&:hover': {
                    opacity: 0.8,
                    '& .delete-button': {
                      opacity: 1,
                    }
                  }
                }}
                onClick={() => setEditingEffectId(effect.id)}
              >
                {/* Delete button positioned on right side - hidden by default, shown on hover */}
                <IconButton
                  className="delete-button"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEffect(effect.id);
                  }}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: -30,
                    transform: 'translateY(-50%)',
                    width: 24,
                    height: 24,
                    bgcolor: '#ff4d4f',
                    color: 'white',
                    opacity: 0,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#ff7875',
                      transform: 'translateY(-50%) scale(1.1)',
                      opacity: '1 !important',
                    },
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 20,
                  }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            );
          })}
          </Box>
        </Box>

        {/* Timeline Controls - Compact */}
        <Box sx={{ 
          flex: 1,
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
          borderTop: '2px solid #e0e0e0',
          overflow: 'auto',
          minHeight: '45%', // Reduced space for timeline to give more to video
          maxHeight: '45%' // Limit timeline height
        }}>
          {/* Control Buttons */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, // Further reduced gap
            p: 1, // Further reduced padding
            borderBottom: '1px solid #f0f0f0',
            bgcolor: 'white',
            flexWrap: 'wrap',
            minHeight: '50px' // Set minimum height for compactness
          }}>
            {/* Undo/Redo Controls - Works for both segments and effects */}
            <IconButton
              onClick={() => {
                // Prioritize segment undo, then effect undo
                if (canUndoSegment()) {
                  undoSegment();
                } else if (canUndo()) {
                  undo();
                }
              }}
              disabled={!canUndoSegment() && !canUndo()}
              size="small"
              sx={{
                color: (canUndoSegment() || canUndo()) ? '#333' : '#ccc',
                '&:hover': {
                  bgcolor: (canUndoSegment() || canUndo()) ? 'rgba(0,0,0,0.08)' : 'transparent'
                }
              }}
              title="Undo (Ctrl+Z) - Segments & Effects"
            >
              <Undo />
            </IconButton>

            <IconButton
              onClick={() => {
                // Prioritize segment redo, then effect redo
                if (canRedoSegment()) {
                  redoSegment();
                } else if (canRedo()) {
                  redo();
                }
              }}
              disabled={!canRedoSegment() && !canRedo()}
              size="small"
              sx={{
                color: (canRedoSegment() || canRedo()) ? '#333' : '#ccc',
                '&:hover': {
                  bgcolor: (canRedoSegment() || canRedo()) ? 'rgba(0,0,0,0.08)' : 'transparent'
                }
              }}
              title="Redo (Ctrl+Y) - Segments & Effects"
            >
              <Redo />
            </IconButton>
            
            {/* Separator */}
            <Box sx={{ 
              width: '1px', 
              height: '20px', 
              bgcolor: '#e0e0e0',
              mx: 1
            }} />
            

            <IconButton 
              onClick={handlePlayPause}
              sx={{ 
                bgcolor: '#1890ff',
                color: 'white',
                '&:hover': { bgcolor: '#40a9ff' }
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleAddEffect('erasure')}
              startIcon={
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: '#5B8FF9' 
                }}>
                  {/* Color indicator */}
                </Box>
              }
              sx={{
                bgcolor: 'white',
                color: '#333',
                border: '1px solid #d9d9d9',
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#fafafa',
                  borderColor: '#40a9ff'
                }
              }}
            >
              Add Erasure Area
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleAddEffect('protection')}
              startIcon={
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  bgcolor: '#5AD8A6' 
                }}>
                  {/* Color indicator */}
                </Box>
              }
              sx={{
                bgcolor: 'white',
                color: '#333',
                border: '1px solid #d9d9d9',
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#fafafa',
                  borderColor: '#52c41a'
                }
              }}
            >
              Add Protection Area
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleAddEffect('text')}
              startIcon={
                <Box sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: '#5D7092'
                }}>
                  {/* Color indicator */}
                </Box>
              }
              sx={{
                bgcolor: 'white',
                color: '#333',
                border: '1px solid #d9d9d9',
                fontSize: '13px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#fafafa',
                  borderColor: '#666'
                }
              }}
            >
              Erase Text
            </Button>

            {/* Add Segment Button - Pro Feature */}
            <Button
              variant="contained"
              size="small"
              onClick={handleAddSegment}
              disabled={getSegmentCount() >= 10}
              startIcon={<Add />}
              sx={{
                bgcolor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                },
                '&:disabled': {
                  background: '#d9d9d9',
                  color: '#999'
                }
              }}
            >
              Add Segment
            </Button>

            <Box sx={{ flex: 1 }} />

            <Typography sx={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
              {formatTime(currentTime, true)} / {formatTime(duration, true)}
            </Typography>

            <IconButton 
              size="small"
              onClick={handleVolumeToggle}
              sx={{
                color: isMuted ? '#ff4d4f' : '#666',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.08)'
                }
              }}
            >
              {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
            </IconButton>
            
            {/* Timeline Zoom Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              ml: 2,
              minWidth: 150
            }}>
              <Typography sx={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
                Zoom
              </Typography>
              <Slider
                value={timelineZoom}
                onChange={(e, value) => setTimelineZoom(value as number)}
                min={0.5}
                max={5}
                step={0.1}
                size="small"
                marks={[{ value: 1, label: '1:1' }]}
                sx={{
                  width: 80,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-track': {
                    color: '#1890ff',
                  },
                  '& .MuiSlider-rail': {
                    color: '#d9d9d9',
                  },
                  '& .MuiSlider-mark': {
                    backgroundColor: '#1890ff',
                    height: 8,
                    width: 2,
                  },
                  '& .MuiSlider-markActive': {
                    backgroundColor: '#1890ff',
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '9px',
                    color: '#666',
                    top: 20,
                  }
                }}
              />
              <Button
                size="small"
                variant={timelineZoom === 1 ? "contained" : "outlined"}
                onClick={() => setTimelineZoom(1)}
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  py: 0.25,
                  fontSize: '10px',
                  height: 20,
                  bgcolor: timelineZoom === 1 ? '#1890ff' : 'transparent',
                  color: timelineZoom === 1 ? 'white' : '#666',
                  borderColor: '#d9d9d9',
                  '&:hover': {
                    bgcolor: timelineZoom === 1 ? '#40a9ff' : 'rgba(24, 144, 255, 0.1)',
                    borderColor: '#1890ff'
                  }
                }}
              >
                1:1
              </Button>
            </Box>
          </Box>

          {/* Video Frames Timeline - GhostCut Style */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'white',
            overflow: 'hidden',
            minHeight: '300px'
          }}>
            
            {/* New Simplified Time Ruler */}
            <Box 
              data-timeline-ruler
              onClick={(e) => {
                // Use centralized timeline interaction handler
                const newTime = handleTimelineInteraction(
                  e.nativeEvent,
                  e.currentTarget,
                  duration,
                  timelineZoom
                );
                handleSeek(newTime);
              }}
              sx={{
                height: 40,
                bgcolor: '#ffffff',
                borderTop: '1px solid #e0e0e0',
                borderBottom: '1px solid #e0e0e0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                minWidth: `${100 * timelineZoom}%`,
                width: `${100 * timelineZoom}%`,
              }}>
              
              {/* Background gradient for visual appeal */}
              <Box sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
                pointerEvents: 'none'
              }} />
              
              {/* Time marks based on actual time positions */}
              {Array.from({ length: Math.min(11, Math.ceil(duration) + 1) }, (_, i) => {
                const markTime = (i / 10) * duration;
                // Use the same percentage calculation as effects and timeline indicator
                const markPercentage = calculateProgressPercentage(markTime, duration);
                const isMainMark = i % 2 === 0;
                return (
                  <Box key={i} sx={{
                    position: 'absolute',
                    left: `${markPercentage}%`,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pointerEvents: 'none'
                  }}>
                    {/* Time label with milliseconds */}
                    {isMainMark && (
                      <Typography sx={{
                        position: 'absolute',
                        top: '2px',
                        fontSize: '10px',
                        color: '#666',
                        fontFamily: 'monospace',
                        fontWeight: 500,
                        userSelect: 'none'
                      }}>
                        {formatTime(markTime, true)}
                      </Typography>
                    )}
                    {/* Tick mark */}
                    <Box sx={{
                      width: '1px',
                      height: isMainMark ? '12px' : '8px',
                      bgcolor: isMainMark ? '#999' : '#ccc',
                      position: 'absolute',
                      bottom: 0
                    }} />
                  </Box>
                );
              })}
              
              {/* Current time indicator - clean red line with draggable handle */}
              {isVideoReady && duration > 0 && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${progressPercentage}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      bgcolor: '#ff4d4f',
                      zIndex: 20,
                      pointerEvents: 'none',
                      boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)'
                    }}
                  />
                  
                  {/* Draggable time handle */}
                  <Box
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTimeline(true);
                      const startX = e.clientX;
                      const startTime = currentTime;
                      
                      // Get timeline container reference
                      const timelineContainer = e.currentTarget.closest('[data-timeline-ruler]') as HTMLElement;
                      if (!timelineContainer) {
                        setIsDraggingTimeline(false);
                        return;
                      }
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        // Use centralized timeline interaction
                        const newTime = handleTimelineInteraction(
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
                    }}
                    sx={{
                      position: 'absolute',
                      left: `${progressPercentage}%`,
                      top: -3,
                      width: '8px',
                      height: '46px',
                      bgcolor: isDraggingTimeline ? 'rgba(255, 77, 79, 0.2)' : 'transparent',
                      cursor: 'ew-resize',
                      zIndex: 21,
                      transform: 'translateX(-4px)',
                      borderRadius: '2px',
                      '&:hover': {
                        bgcolor: 'rgba(255, 77, 79, 0.15)',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '3px',
                          height: '20px',
                          bgcolor: '#ff4d4f',
                          borderRadius: '1px',
                          boxShadow: '0 0 4px rgba(255, 77, 79, 0.8)'
                        }
                      }
                    }}
                  />
                  
                  {/* Current time display */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${progressPercentage}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      bgcolor: '#ff4d4f',
                      color: 'white',
                      px: 1,
                      py: 0.25,
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      zIndex: 21,
                      pointerEvents: 'none',
                      opacity: progressPercentage > 5 && progressPercentage < 95 ? 1 : 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {formatTime(currentTime, true)}
                  </Box>
                </>
              )}
            </Box>
            
            {/* Timeline Content Area */}
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
            
            {/* Frame Strip - GhostCut Style */}
            <Box 
              ref={frameStripRef}
              data-frame-strip
              onClick={(e) => {
                // Use centralized timeline interaction handler
                const newTime = handleTimelineInteraction(
                  e.nativeEvent,
                  e.currentTarget,
                  duration,
                  timelineZoom
                );
                handleSeek(newTime);
              }}
              sx={{
                height: 80,
                bgcolor: 'white',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                position: 'relative',
                border: '1px solid #d9d9d9',
                mb: 1,
                minWidth: `${100 * timelineZoom}%`,
                width: `${100 * timelineZoom}%`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {/* Thumbnail Images with borders */}
              {thumbnails.map((thumb, index) => (
                <Box
                  key={index}
                  sx={{
                    height: '100%',
                    width: `${100 / thumbnails.length}%`,
                    position: 'relative',
                    borderRight: index < thumbnails.length - 1 ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <Box
                    component="img"
                    src={thumb}
                    sx={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              ))}
              
              {/* Current Time Indicator on Frame Strip - Clean vertical line with draggable handle */}
              {isVideoReady && duration > 0 && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${progressPercentage}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      bgcolor: '#ff4d4f',
                      zIndex: 30,
                      pointerEvents: 'none',
                      boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)'
                    }}
                  />
                  
                  {/* Draggable handle for frame strip */}
                  <Box
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTimeline(true);
                      const startX = e.clientX;
                      const startTime = currentTime;
                      
                      // Get frame strip container reference
                      const frameStripContainer = e.currentTarget.closest('[data-frame-strip]') as HTMLElement;
                      if (!frameStripContainer) {
                        setIsDraggingTimeline(false);
                        return;
                      }
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        // Use centralized timeline interaction
                        const newTime = handleTimelineInteraction(
                          moveEvent,
                          frameStripContainer,
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
                    }}
                    sx={{
                      position: 'absolute',
                      left: `${progressPercentage}%`,
                      top: -5,
                      width: '8px',
                      height: '90px',
                      bgcolor: isDraggingTimeline ? 'rgba(255, 77, 79, 0.2)' : 'transparent',
                      cursor: 'ew-resize',
                      zIndex: 31,
                      transform: 'translateX(-4px)',
                      borderRadius: '2px',
                      '&:hover': {
                        bgcolor: 'rgba(255, 77, 79, 0.15)',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '3px',
                          height: '40px',
                          bgcolor: '#ff4d4f',
                          borderRadius: '1px',
                          boxShadow: '0 0 4px rgba(255, 77, 79, 0.8)'
                        }
                      }
                    }}
                  />
                </>
              )}

            </Box>

            {/* Timeline Effects Tracks - GhostCut Style */}
            <Box sx={{ 
              position: 'relative',
              flex: 1,
              minHeight: 200,
              maxHeight: 300,
              bgcolor: 'white',
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              display: 'flex',
              flexDirection: 'column',
              minWidth: `${100 * timelineZoom}%`,
              width: `${100 * timelineZoom}%`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              overflow: 'hidden' // Add overflow hidden to contain the timeline
            }}>
              {/* Timeline Indicator spanning entire timeline effects area */}
              {isVideoReady && duration > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${progressPercentage}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    bgcolor: '#ff4d4f',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 0 6px rgba(255, 77, 79, 0.6)',
                    transform: 'translateX(-1px)',
                  }}
                />
              )}
              
              {/* Simple header without duplicate buttons */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
                pb: 1,
                borderBottom: '1px solid #e9ecef'
              }}>
                <Typography sx={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
                  Effect Track
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#999' }}>
                  Current Effects ({timelineEffects.length})
                </Typography>
              </Box>
              
              {/* Effect Bars - GhostCut Style with Separate Tracks */}
              <Box sx={{ 
                position: 'relative', 
                flex: 1, 
                minHeight: '150px',
                maxHeight: '220px',
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f5f5f5',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#d9d9d9',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: '#bfbfbf',
                  },
                },
              }}>
              
              {/* Dynamic effect rows - each effect gets its own row */}
              <Box sx={{
                position: 'relative',
                height: `${Math.max(50, timelineEffects.length * 40)}px`,
                width: '100%'
              }}>
                
  
              {timelineEffects.map((effect, index) => {
                  // Each effect gets its own row
                  const trackTop = index * 40 + 5; // 40px spacing between rows, 5px top margin

                  // Use the same calculation as timeline indicator for perfect sync
                  const trackWidth = 100; // Full width percentage
                  // Direct percentage values without additional division
                  const effectLeft = effect.startFrame;
                  const effectWidth = effect.endFrame - effect.startFrame;

                  // Check if this is a segment and if it's selected
                  const isSegment = segments.some(seg => seg.id === effect.id);
                  const isSelected = isSegment
                    ? currentSegmentId === effect.id
                    : editingEffectId === effect.id;

                return (
                  <Box
                    key={effect.id}
                    sx={{
                      position: 'absolute',
                      left: `${effectLeft}%`,
                      width: `${effectWidth}%`,
                      top: `${trackTop}px`,
                      height: '30px',
                      bgcolor: effect.color,
                      borderRadius: '4px',
                      cursor: 'move',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      opacity: isSelected ? 1 : 0.85,
                      zIndex: 15,
                      border: isSelected ? '2px solid #1890ff' : '1px solid rgba(255,255,255,0.3)',
                      boxShadow: isSelected ? '0 2px 8px rgba(24,144,255,0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        opacity: 1,
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        '& [data-drag-handle="true"]': {
                          opacity: 1
                        }
                      }
                    }}
                    onMouseDown={(e) => handleTimelineEffectDrag(e, effect.id, 'move')}
                    onClick={(e) => handleEffectClick(effect.id, e)}
                  >
                    {/* Start Handle - More subtle */}
                    <Box
                      data-drag-handle="true"
                      sx={{
                        position: 'absolute',
                        left: -2,
                        top: 0,
                        bottom: 0,
                        width: '6px',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        cursor: 'ew-resize',
                        borderRadius: '2px 0 0 2px',
                        opacity: 0,
                        zIndex: 20,
                        pointerEvents: 'auto',
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,1)',
                          opacity: 1,
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleTimelineEffectDrag(e, effect.id, 'start');
                      }}
                    />

                    {/* Dynamic Label Positioning based on segment width */}
                    {(() => {
                      const startTime = (effect.startFrame / 100) * duration;
                      const endTime = (effect.endFrame / 100) * duration;
                      const timeLabel = `${formatTime(startTime, true)} - ${formatTime(endTime, true)}`;

                      // Calculate pixel width of segment for label positioning logic
                      const timelineContainer = frameStripRef.current;
                      const segmentPixelWidth = timelineContainer
                        ? (effectWidth / 100) * timelineContainer.offsetWidth
                        : effectWidth * 10; // Fallback estimate

                      // Dynamic positioning thresholds
                      const WIDE_THRESHOLD = 150;   // Wide: show full label inside
                      const MEDIUM_THRESHOLD = 80;  // Medium: show abbreviated inside
                      // Below MEDIUM_THRESHOLD: show badge only, full text on hover

                      if (segmentPixelWidth > WIDE_THRESHOLD) {
                        // Wide segment: Full label inside (centered)
                        return (
                          <Box sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Typography sx={{
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: 600,
                              userSelect: 'none',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              {effect.label}
                            </Typography>
                            <Typography sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: '8px',
                              fontFamily: 'monospace',
                              userSelect: 'none',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              {timeLabel}
                            </Typography>
                          </Box>
                        );
                      } else if (segmentPixelWidth > MEDIUM_THRESHOLD) {
                        // Medium segment: Abbreviated label inside
                        const segmentNumber = effect.label.match(/\d+/)?.[0] || index + 1;
                        return (
                          <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }} title={`${effect.label}\n${timeLabel}`}>
                            <Typography sx={{
                              color: 'white',
                              fontSize: '9px',
                              fontWeight: 600,
                              userSelect: 'none',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                            }}>
                              Seg {segmentNumber}
                            </Typography>
                          </Box>
                        );
                      } else {
                        // Narrow segment: Number badge only with tooltip
                        const segmentNumber = effect.label.match(/\d+/)?.[0] || index + 1;
                        return (
                          <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }} title={`${effect.label}\n${timeLabel}`}>
                            <Box sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}>
                              <Typography sx={{
                                color: effect.color,
                                fontSize: '10px',
                                fontWeight: 700,
                                userSelect: 'none',
                              }}>
                                {segmentNumber}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }
                    })()}

                    {/* Delete Button - More subtle */}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTimelineEffect(effect.id);
                      }}
                      sx={{
                        p: 0.25,
                        color: 'rgba(255,255,255,0.9)',
                        opacity: 0.8,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          opacity: 1,
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: 12 }} />
                    </IconButton>

                    {/* End Handle - More subtle */}
                    <Box
                      data-drag-handle="true"
                      sx={{
                        position: 'absolute',
                        right: -2,
                        top: 0,
                        bottom: 0,
                        width: '6px',
                        bgcolor: 'rgba(255,255,255,0.8)',
                        cursor: 'ew-resize',
                        borderRadius: '0 2px 2px 0',
                        opacity: 0,
                        zIndex: 20,
                        pointerEvents: 'auto',
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,1)',
                          opacity: 1,
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleTimelineEffectDrag(e, effect.id, 'end');
                      }}
                    />
                  </Box>
                );
              })}
              </Box>
            </Box> {/* Close Timeline Content Area */}
          </Box> {/* Close Video Frames Timeline */}
        </Box> {/* Close Main Content Area */}

      </Box>
    </Box>
    </Box>
    </Box>

      {/* Segment Dialog */}
      <SegmentDialog
        open={isSegmentDialogOpen}
        onClose={handleCloseDialog}
        editingSegmentId={editingSegmentId}
        videoDuration={duration}
        currentTime={currentTime}
      />
    </Box>
  );
};

export default ProVideoEditor;