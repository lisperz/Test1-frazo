/**
 * Segment Dialog - Add or edit video segment with audio input
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close,
  CloudUpload,
  CheckCircle,
} from '@mui/icons-material';
import {
  useSegmentsStore,
  createNewSegment,
  validateAudioFile,
  formatSegmentTime,
} from '../../../store/segmentsStore';
import { AudioInput } from '../../../types/segments';

interface SegmentDialogProps {
  open: boolean;
  onClose: () => void;
  editingSegmentId: string | null;
  videoDuration: number;
  currentTime: number;
}

const SegmentDialog: React.FC<SegmentDialogProps> = ({
  open,
  onClose,
  editingSegmentId,
  videoDuration,
  currentTime,
}) => {
  const {
    addSegment,
    updateSegment,
    getSegmentById,
    validateSegmentTimes,
  } = useSegmentsStore();

  // Form state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (editingSegmentId) {
        // Edit mode - load existing segment
        const segment = getSegmentById(editingSegmentId);
        if (segment) {
          setStartTime(segment.startTime);
          setEndTime(segment.endTime);
          setLabel(segment.label || '');
          // Note: Can't load the actual File object, so show filename only
          setAudioFile(segment.audioInput.file);
        }
      } else {
        // Add mode - use current time as start
        const suggestedStart = Math.floor(currentTime);
        const suggestedEnd = Math.min(suggestedStart + 15, Math.floor(videoDuration));
        setStartTime(suggestedStart);
        setEndTime(suggestedEnd);
        setLabel('');
        setAudioFile(null);
      }
      setError(null);
    }
  }, [open, editingSegmentId, currentTime, videoDuration, getSegmentById]);

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateAudioFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid audio file');
        return;
      }
      setAudioFile(file);
      setError(null);
    }
  };

  const handleSubmit = () => {
    // Validate audio file is selected
    if (!audioFile && !editingSegmentId) {
      setError('Please select an audio file');
      return;
    }

    // Validate time range
    const validation = validateSegmentTimes(startTime, endTime, editingSegmentId || undefined);
    if (!validation.valid) {
      setError(validation.error || 'Invalid time range');
      return;
    }

    if (editingSegmentId) {
      // Update existing segment
      const updates: any = {
        startTime,
        endTime,
        label,
      };
      if (audioFile) {
        const audioInput: AudioInput = {
          refId: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: audioFile,
          fileName: audioFile.name,
          fileSize: audioFile.size,
        };
        updates.audioInput = audioInput;
      }
      updateSegment(editingSegmentId, updates);
    } else {
      // Create new segment
      const audioInput: AudioInput = {
        refId: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: audioFile!,
        fileName: audioFile!.name,
        fileSize: audioFile!.size,
      };

      const newSegment = createNewSegment(startTime, endTime, audioInput, label);
      addSegment(newSegment);
    }

    onClose();
  };

  const duration = endTime - startTime;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
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

        {/* Time Range Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            ⏱️ Segment Time Range
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
            <TextField
              label="Start Time (seconds)"
              type="number"
              value={startTime}
              onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
              inputProps={{ min: 0, max: videoDuration, step: 0.1 }}
              size="small"
              fullWidth
            />
            <TextField
              label="End Time (seconds)"
              type="number"
              value={endTime}
              onChange={(e) => setEndTime(Math.min(videoDuration, parseFloat(e.target.value) || 0))}
              inputProps={{ min: 0, max: videoDuration, step: 0.1 }}
              size="small"
              fullWidth
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Duration: {formatSegmentTime(duration)} • Video Length: {formatSegmentTime(videoDuration)}
          </Typography>
        </Box>

        {/* Audio Upload Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            🎵 Audio File
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            component="label"
          >
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.aac"
              onChange={handleAudioFileChange}
              style={{ display: 'none' }}
            />

            {audioFile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="body2">
                  {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudUpload sx={{ fontSize: 40, color: 'action.active', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Click to upload audio file
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported: MP3, WAV, M4A, AAC • Max 100MB
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Optional Label */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            📝 Label (Optional)
          </Typography>
          <TextField
            label="Segment Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Interview Section"
            size="small"
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            Add a label to identify this segment
          </Typography>
        </Box>
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

export default SegmentDialog;
