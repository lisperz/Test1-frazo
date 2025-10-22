import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

/**
 * How It Works section
 * Explains the 3-step process for video text inpainting
 */
const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Upload Video',
      description: 'Select your video file with text you want to remove',
    },
    {
      number: 2,
      title: 'AI Processing',
      description: 'Our AI automatically detects and removes text from your video',
    },
    {
      number: 3,
      title: 'Download Result',
      description: 'Download your clean video with text removed',
    },
  ];

  return (
    <Box sx={{ mt: 6 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            How it works
          </Typography>
          <Grid container spacing={3}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}
                  >
                    {step.number}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HowItWorks;
