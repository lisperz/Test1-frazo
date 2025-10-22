import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

/**
 * Help section with instructions and notes
 * Provides guidance on how to use the video inpainting feature
 */
const HelpSection: React.FC = () => {
  return (
    <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        How it works
      </Typography>
      <Typography variant="body2" component="div">
        <ol>
          <li>Upload your video file (MP4, AVI, MOV, etc.)</li>
          <li>Our AI automatically detects and removes text from the video</li>
          <li>Download your processed video with text removed</li>
        </ol>
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        <strong>Note:</strong> Processing may take several minutes depending on video length and
        complexity. You can check the status in your Ghostcut dashboard as well.
      </Typography>
    </Box>
  );
};

export default HelpSection;
