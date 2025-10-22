/**
 * Segment Dialog - Add or edit video segment with audio input
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useSegmentForm } from './hooks/useSegmentForm';
import TimeRangeSection from './components/TimeRangeSection';
import AudioUploadSection from './components/AudioUploadSection';
import AudioCropSection from './components/AudioCropSection';
import LabelSection from './components/LabelSection';

interface SegmentDialogProps {
  open: boolean;
  onClose: () => void;
  editingSegmentId: string | null;
  videoDuration: number;
  currentTime: number;
}

const SegmentDialogRefactored: React.FC<SegmentDialogProps> = ({
  open,
  onClose,
  editingSegmentId,
  videoDuration,
  currentTime,
}) => {
  const {
    startTime,
    endTime,
    audioFile,
    label,
    error,
    enableAudioCrop,
    audioStartTime,
    audioEndTime,
    setStartTime,
    setEndTime,
    setLabel,
    handleAudioFileChange,
    handleAudioCropChange,
    setAudioStartTime,
    setAudioEndTime,
    submitForm,
  } = useSegmentForm({ open, editingSegmentId, videoDuration, currentTime });

  const handleSubmit = () => {
    if (submitForm()) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {editingSegmentId ? 'Edit Segment' : 'Add New Segment'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TimeRangeSection
          startTime={startTime}
          endTime={endTime}
          videoDuration={videoDuration}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
        />

        <Box sx={{ mb: 3 }}>
          <AudioUploadSection audioFile={audioFile} onFileChange={handleAudioFileChange} />
          {audioFile && (
            <AudioCropSection
              enableAudioCrop={enableAudioCrop}
              audioStartTime={audioStartTime}
              audioEndTime={audioEndTime}
              onEnableChange={handleAudioCropChange}
              onStartTimeChange={setAudioStartTime}
              onEndTimeChange={setAudioEndTime}
            />
          )}
        </Box>

        <LabelSection label={label} onLabelChange={setLabel} />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            },
          }}
        >
          {editingSegmentId ? 'Update Segment' : 'Add Segment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SegmentDialogRefactored;
