import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  Slider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Delete,
  Add,
} from '@mui/icons-material';
import { VideoAnnotation } from '../../types/videoEditor';

interface SimpleVideoEditorProps {
  videoUrl: string;
  videoFile: File | null;
  onAnnotationsChange: (annotations: VideoAnnotation[]) => void;
}

const SimpleVideoEditor: React.FC<SimpleVideoEditorProps> = ({
  videoUrl,
  videoFile,
  onAnnotationsChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<'Erase' | 'Protect' | 'Text'>('Erase');
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    onAnnotationsChange(annotations);
  }, [annotations, onAnnotationsChange]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (_: Event, value: number | number[]) => {
    const time = value as number;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawStart({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setCurrentRect({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y),
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 0.01 && currentRect.height > 0.01) {
      const newAnnotation: VideoAnnotation = {
        id: `ann_${Date.now()}`,
        label: selectedLabel,
        startTime: currentTime,
        endTime: Math.min(currentTime + 5, duration), // Default 5 seconds duration
        rectangle: currentRect,
      };
      setAnnotations([...annotations, newAnnotation]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Erase': return '#FF6B6B';
      case 'Protect': return '#4ECDC4';
      case 'Text': return '#45B7D1';
      default: return '#999';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Video Annotation Editor
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Draw rectangles on the video and label them as areas to Erase, Protect, or mark as Text. Use the timeline to set when each annotation should be active.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, position: 'relative' }}>
            <Box
              sx={{ position: 'relative', width: '100%', backgroundColor: '#000' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                style={{ width: '100%', display: 'block' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
              
              {/* Show current drawing rectangle */}
              {currentRect && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${currentRect.x * 100}%`,
                    top: `${currentRect.y * 100}%`,
                    width: `${currentRect.width * 100}%`,
                    height: `${currentRect.height * 100}%`,
                    border: `2px solid ${getLabelColor(selectedLabel)}`,
                    backgroundColor: `${getLabelColor(selectedLabel)}33`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              
              {/* Show existing annotations at current time */}
              {annotations
                .filter(ann => currentTime >= ann.startTime && currentTime <= ann.endTime)
                .map(ann => (
                  <Box
                    key={ann.id}
                    sx={{
                      position: 'absolute',
                      left: `${ann.rectangle.x * 100}%`,
                      top: `${ann.rectangle.y * 100}%`,
                      width: `${ann.rectangle.width * 100}%`,
                      height: `${ann.rectangle.height * 100}%`,
                      border: `2px solid ${getLabelColor(ann.label)}`,
                      backgroundColor: `${getLabelColor(ann.label)}22`,
                      pointerEvents: 'none',
                    }}
                  >
                    <Chip
                      label={ann.label}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: -2,
                        backgroundColor: getLabelColor(ann.label),
                        color: 'white',
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                ))}
            </Box>

            {/* Video Controls */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={handlePlayPause}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <Typography variant="body2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={handleSeek}
                  sx={{ flexGrow: 1 }}
                />
              </Box>
            </Box>

            {/* Label Selection */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Select annotation type:
              </Typography>
              <ToggleButtonGroup
                value={selectedLabel}
                exclusive
                onChange={(_, value) => value && setSelectedLabel(value)}
                size="small"
              >
                <ToggleButton value="Erase" sx={{ color: '#FF6B6B' }}>
                  Erase
                </ToggleButton>
                <ToggleButton value="Protect" sx={{ color: '#4ECDC4' }}>
                  Protect
                </ToggleButton>
                <ToggleButton value="Text" sx={{ color: '#45B7D1' }}>
                  Text
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Annotations ({annotations.length})
            </Typography>
            
            {annotations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No annotations yet. Draw rectangles on the video to add annotations.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {annotations.map((ann, index) => (
                  <Paper
                    key={ann.id}
                    variant="outlined"
                    sx={{ p: 1, mb: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Chip
                          label={ann.label}
                          size="small"
                          sx={{
                            backgroundColor: getLabelColor(ann.label),
                            color: 'white',
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="caption" display="block">
                          {formatTime(ann.startTime)} - {formatTime(ann.endTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Position: {(ann.rectangle.x * 100).toFixed(1)}%, {(ann.rectangle.y * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAnnotation(ann.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleVideoEditor;