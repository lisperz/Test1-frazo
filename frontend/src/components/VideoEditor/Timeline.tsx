import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import { Box, Paper, Typography, IconButton, Chip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { VideoEffect } from '../../store/effectsStore';

interface TimelineProps {
  videoUrl: string;
  effects: VideoEffect[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onEffectUpdate: (id: string, startTime: number, endTime: number) => void;
  onEffectSelect: (id: string) => void;
  onEffectDelete: (id: string) => void;
  selectedEffectId: string | null;
}

const Timeline: React.FC<TimelineProps> = ({
  videoUrl,
  effects,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onEffectUpdate,
  onEffectSelect,
  onEffectDelete,
  selectedEffectId,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<any>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getEffectColor = (type: string): string => {
    switch (type) {
      case 'erasure': return '#ef4444';
      case 'protection': return '#10b981';
      case 'text': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (!waveformRef.current || wavesurferRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#9ca3af',
      progressColor: '#6366f1',
      cursorColor: '#ef4444',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      normalize: true,
      interact: true,
      minPxPerSec: 100, // Balanced resolution matching GhostCut spacing
      autoScroll: true,
      autoCenter: false,
      plugins: [
        TimelinePlugin.create({
          height: 25,
          insertPosition: 'beforebegin',
          timeInterval: 1, // Tick marks every 1 second
          primaryLabelInterval: 10, // Major labels every 10 seconds like GhostCut
          secondaryLabelInterval: 5, // Minor labels every 5 seconds
          formatTimeCallback: (seconds: number) => {
            // Format time as HH:MM:SS like GhostCut
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          },
          style: {
            fontSize: '10px',
            color: '#666666',
            fontWeight: '400',
            fontFamily: 'monospace',
          },
        }),
      ],
    });

    const regions = wavesurfer.registerPlugin(
      RegionsPlugin.create()
    );

    wavesurferRef.current = wavesurfer;
    regionsRef.current = regions;

    // Load audio
    wavesurfer.load(videoUrl);

    // Handle interactions
    wavesurfer.on('interaction', (newTime) => {
      onSeek(newTime);
    });

    wavesurfer.on('ready', () => {
      // Initialize regions after waveform is ready
      effects.forEach(effect => {
        const color = getEffectColor(effect.type);
        regions.addRegion({
          id: effect.id,
          start: effect.startTime,
          end: effect.endTime,
          color: `${color}40`,
          drag: true,
          resize: true,
        });
      });
    });

    // Handle region events
    regions.on('region-updated', (region: any) => {
      onEffectUpdate(region.id, region.start, region.end);
    });

    regions.on('region-clicked', (region: any, e: MouseEvent) => {
      e.stopPropagation();
      onEffectSelect(region.id);
    });

    regions.on('region-in', (region: any) => {
      setHoveredRegion(region.id);
    });

    regions.on('region-out', () => {
      setHoveredRegion(null);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [videoUrl]);

  // Update regions when effects change
  useEffect(() => {
    if (!regionsRef.current) return;

    const regions = regionsRef.current.getRegions();
    const regionIds = regions.map((r: any) => r.id);
    const effectIds = effects.map(e => e.id);

    // Remove regions that no longer exist in effects
    regionIds.forEach((id: string) => {
      if (!effectIds.includes(id)) {
        const region = regions.find((r: any) => r.id === id);
        if (region) region.remove();
      }
    });

    // Add or update regions
    effects.forEach(effect => {
      const existingRegion = regions.find((r: any) => r.id === effect.id);
      const color = getEffectColor(effect.type);
      
      if (existingRegion) {
        // Update existing region
        existingRegion.setOptions({
          start: effect.startTime,
          end: effect.endTime,
          color: selectedEffectId === effect.id ? `${color}60` : `${color}40`,
        });
      } else {
        // Add new region
        regionsRef.current.addRegion({
          id: effect.id,
          start: effect.startTime,
          end: effect.endTime,
          color: selectedEffectId === effect.id ? `${color}60` : `${color}40`,
          drag: true,
          resize: true,
        });
      }
    });
  }, [effects, selectedEffectId]);

  // Update playback state
  useEffect(() => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.play();
    } else {
      wavesurferRef.current.pause();
    }
  }, [isPlaying]);

  // Update current time
  useEffect(() => {
    if (!wavesurferRef.current || !duration) return;
    
    wavesurferRef.current.seekTo(currentTime / duration);
  }, [currentTime, duration]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper sx={{ p: 2, position: 'relative' }}>
      <Typography variant="subtitle2" gutterBottom>
        Timeline & Regions
      </Typography>
      
      <Box
        ref={waveformRef}
        sx={{
          width: '100%',
          height: 125, // Adjusted height for GhostCut-style timeline
          position: 'relative',
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      />

      {/* Region Labels */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {effects.map(effect => (
          <Paper
            key={effect.id}
            variant="outlined"
            sx={{
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              bgcolor: selectedEffectId === effect.id ? 'action.selected' : 'transparent',
              borderColor: hoveredRegion === effect.id ? getEffectColor(effect.type) : 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => onEffectSelect(effect.id)}
          >
            <Chip
              label={effect.type}
              size="small"
              sx={{
                bgcolor: getEffectColor(effect.type),
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
                textTransform: 'capitalize',
              }}
            />
            <Typography variant="caption">
              {formatTime(effect.startTime)} - {formatTime(effect.endTime)}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEffectDelete(effect.id);
              }}
              sx={{ p: 0.25 }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        ))}
      </Box>

      {effects.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          No effects added yet. Click "Add Effect" to start annotating the video.
        </Typography>
      )}
    </Paper>
  );
};

export default Timeline;