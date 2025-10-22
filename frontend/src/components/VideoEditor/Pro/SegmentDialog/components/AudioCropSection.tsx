import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Collapse,
} from '@mui/material';
import { ContentCut } from '@mui/icons-material';
import { formatSegmentTime } from '../../../../../store/segmentsStore';

interface AudioCropSectionProps {
  enableAudioCrop: boolean;
  audioStartTime: number | null;
  audioEndTime: number | null;
  onEnableChange: (enabled: boolean) => void;
  onStartTimeChange: (time: number | null) => void;
  onEndTimeChange: (time: number | null) => void;
}

const AudioCropSection: React.FC<AudioCropSectionProps> = ({
  enableAudioCrop,
  audioStartTime,
  audioEndTime,
  onEnableChange,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={enableAudioCrop}
            onChange={(e) => onEnableChange(e.target.checked)}
            sx={{
              color: '#f59e0b',
              '&.Mui-checked': {
                color: '#f59e0b',
              },
            }}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ContentCut sx={{ fontSize: 18, color: '#f59e0b' }} />
            <Typography variant="body2">Crop Audio (Optional)</Typography>
          </Box>
        }
      />

      <Collapse in={enableAudioCrop}>
        <Box sx={{ mt: 1.5, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Specify which part of the audio file to use for lip-sync
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Audio Start (seconds)"
              type="number"
              value={audioStartTime ?? ''}
              onChange={(e) => onStartTimeChange(e.target.value ? parseFloat(e.target.value) : null)}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
              placeholder="e.g., 2.5"
            />
            <TextField
              label="Audio End (seconds)"
              type="number"
              value={audioEndTime ?? ''}
              onChange={(e) => onEndTimeChange(e.target.value ? parseFloat(e.target.value) : null)}
              inputProps={{ min: 0, step: 0.1 }}
              size="small"
              fullWidth
              placeholder="e.g., 12.5"
            />
          </Box>

          {audioStartTime !== null && audioEndTime !== null && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Audio duration: {formatSegmentTime(audioEndTime - audioStartTime)}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AudioCropSection;
