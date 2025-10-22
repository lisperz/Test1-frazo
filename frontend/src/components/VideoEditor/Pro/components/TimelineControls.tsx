import React from 'react';
import { Box, Typography, Button, IconButton, Slider } from '@mui/material';
import { PlayArrow, Pause, Undo, Redo, VolumeUp, VolumeOff, Add } from '@mui/icons-material';

interface TimelineControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  timelineZoom: number;
  canUndo: boolean;
  canRedo: boolean;
  segmentCount: number;
  onPlayPause: () => void;
  onVolumeToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomChange: (zoom: number) => void;
  onAddEffect: (type: 'erasure' | 'protection' | 'text') => void;
  onAddSegment: () => void;
  formatTime: (seconds: number, includeMs?: boolean) => string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  timelineZoom,
  canUndo,
  canRedo,
  segmentCount,
  onPlayPause,
  onVolumeToggle,
  onUndo,
  onRedo,
  onZoomChange,
  onAddEffect,
  onAddSegment,
  formatTime,
}) => {
  const renderColorButton = (
    label: string,
    color: string,
    type: 'erasure' | 'protection' | 'text'
  ) => (
    <Button
      variant="contained"
      size="small"
      onClick={() => onAddEffect(type)}
      startIcon={
        <Box sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: color
        }} />
      }
      sx={{
        bgcolor: 'white',
        color: '#333',
        border: '1px solid #d9d9d9',
        fontSize: '13px',
        textTransform: 'none',
        '&:hover': {
          bgcolor: '#fafafa',
          borderColor: type === 'erasure' ? '#40a9ff' : type === 'protection' ? '#52c41a' : '#666'
        }
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      p: 1,
      borderBottom: '1px solid #f0f0f0',
      bgcolor: 'white',
      flexWrap: 'wrap',
      minHeight: '50px'
    }}>
      {/* Undo/Redo Controls */}
      <IconButton
        onClick={onUndo}
        disabled={!canUndo}
        size="small"
        sx={{
          color: canUndo ? '#333' : '#ccc',
          '&:hover': {
            bgcolor: canUndo ? 'rgba(0,0,0,0.08)' : 'transparent'
          }
        }}
        title="Undo (Ctrl+Z)"
      >
        <Undo />
      </IconButton>

      <IconButton
        onClick={onRedo}
        disabled={!canRedo}
        size="small"
        sx={{
          color: canRedo ? '#333' : '#ccc',
          '&:hover': {
            bgcolor: canRedo ? 'rgba(0,0,0,0.08)' : 'transparent'
          }
        }}
        title="Redo (Ctrl+Y)"
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
        onClick={onPlayPause}
        sx={{
          bgcolor: '#1890ff',
          color: 'white',
          '&:hover': { bgcolor: '#40a9ff' }
        }}
      >
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>

      {renderColorButton('Add Erasure Area', '#5B8FF9', 'erasure')}
      {renderColorButton('Add Protection Area', '#5AD8A6', 'protection')}
      {renderColorButton('Erase Text', '#5D7092', 'text')}

      {/* Add Segment Button - Pro Feature */}
      <Button
        variant="contained"
        size="small"
        onClick={onAddSegment}
        disabled={segmentCount >= 10}
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
        onClick={onVolumeToggle}
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
          onChange={(e, value) => onZoomChange(value as number)}
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
          onClick={() => onZoomChange(1)}
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
  );
};

export default TimelineControls;
