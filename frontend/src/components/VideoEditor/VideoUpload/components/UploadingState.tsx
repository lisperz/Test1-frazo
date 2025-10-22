import React from 'react';
import { Box, Typography, Avatar, LinearProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface UploadingStateProps {
  uploadProgress: number;
}

const UploadingState: React.FC<UploadingStateProps> = ({ uploadProgress }) => {
  return (
    <Box>
      <Avatar
        sx={{
          width: 80,
          height: 80,
          mx: 'auto',
          mb: 3,
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        }}
      >
        <CloudUpload sx={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#2d3748' }}>
        Uploading Video...
      </Typography>
      <Box sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              borderRadius: 4,
            },
          }}
        />
      </Box>
      <Typography variant="h6" sx={{ color: '#52c41a', fontWeight: 600 }}>
        {uploadProgress}% complete
      </Typography>
    </Box>
  );
};

export default UploadingState;
