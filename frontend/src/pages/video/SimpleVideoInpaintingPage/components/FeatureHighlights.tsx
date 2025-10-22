import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { AutoFixHigh, Speed, Security } from '@mui/icons-material';

/**
 * Feature highlights section displaying key benefits
 * Shows AI-powered, fast processing, and security features
 */
const FeatureHighlights: React.FC = () => {
  const features = [
    {
      icon: <AutoFixHigh color="primary" sx={{ fontSize: 40, mb: 1 }} />,
      title: 'AI-Powered',
      description: 'Automatic text detection and removal',
    },
    {
      icon: <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />,
      title: 'Fast Processing',
      description: 'Quick turnaround for most videos',
    },
    {
      icon: <Security color="primary" sx={{ fontSize: 40, mb: 1 }} />,
      title: 'Secure',
      description: 'Your videos are processed securely',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
      {features.map((feature, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Box sx={{ textAlign: 'center' }}>
            {feature.icon}
            <Typography variant="subtitle1" fontWeight={600}>
              {feature.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default FeatureHighlights;
