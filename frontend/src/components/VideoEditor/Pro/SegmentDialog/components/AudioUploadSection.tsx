import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';

interface AudioUploadSectionProps {
  audioFile: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({
  audioFile,
  onFileChange,
}) => {
  return (
    <Box>
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
          onChange={onFileChange}
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
  );
};

export default AudioUploadSection;
