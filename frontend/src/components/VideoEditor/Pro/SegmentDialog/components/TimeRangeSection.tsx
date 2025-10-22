import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { formatSegmentTime } from '../../../../../store/segmentsStore';

interface TimeRangeSectionProps {
  startTime: number;
  endTime: number;
  videoDuration: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
}

const TimeRangeSection: React.FC<TimeRangeSectionProps> = ({
  startTime,
  endTime,
  videoDuration,
  onStartTimeChange,
  onEndTimeChange,
}) => {
  const duration = endTime - startTime;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        ⏱️ Segment Time Range
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
        <TextField
          label="Start Time (seconds)"
          type="number"
          value={startTime}
          onChange={(e) => onStartTimeChange(Math.max(0, parseFloat(e.target.value) || 0))}
          inputProps={{ min: 0, max: videoDuration, step: 0.1 }}
          size="small"
          fullWidth
        />
        <TextField
          label="End Time (seconds)"
          type="number"
          value={endTime}
          onChange={(e) => onEndTimeChange(Math.min(videoDuration, parseFloat(e.target.value) || 0))}
          inputProps={{ min: 0, max: videoDuration, step: 0.1 }}
          size="small"
          fullWidth
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Duration: {formatSegmentTime(duration)} • Video Length: {formatSegmentTime(videoDuration)}
      </Typography>
    </Box>
  );
};

export default TimeRangeSection;
