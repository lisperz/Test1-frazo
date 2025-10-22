import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { AutoFixHigh, Speed, Security } from '@mui/icons-material';

const FeatureHighlights: React.FC = () => {
  return (
    <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
      <Grid item xs={12} sm={4}>
        <Box sx={{ textAlign: 'center' }}>
          <AutoFixHigh color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={600}>AI-Powered</Typography>
          <Typography variant="body2" color="text.secondary">
            Automatic text detection and removal
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={600}>Fast Processing</Typography>
          <Typography variant="body2" color="text.secondary">
            Quick turnaround for most videos
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box sx={{ textAlign: 'center' }}>
          <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={600}>Secure</Typography>
          <Typography variant="body2" color="text.secondary">
            Your videos are processed securely
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default FeatureHighlights;
