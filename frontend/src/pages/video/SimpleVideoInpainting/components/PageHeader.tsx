import React from 'react';
import { Box, Typography } from '@mui/material';
import FeatureHighlights from './FeatureHighlights';

const PageHeader: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', mb: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Video Text Inpainting
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 400 }}>
        Remove text from videos automatically using AI
      </Typography>
      <FeatureHighlights />
    </Box>
  );
};

export default PageHeader;
