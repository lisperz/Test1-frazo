/**
 * Hero Section - Home page hero with CTA
 */

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { PlayCircleOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 8, pb: 6, textAlign: 'center' }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Professional Video Text Inpainting
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          Remove text, subtitles, and watermarks from your videos using advanced AI technology
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayCircleOutline />}
            onClick={() => navigate('/register')}
            sx={{ px: 4, py: 1.5 }}
          >
            Get Started Free
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.5 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HeroSection;
