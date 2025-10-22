import React from 'react';
import { Container, Typography, Box, Chip } from '@mui/material';

interface HeroSectionProps {
  creditsBalance: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ creditsBalance }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.9) 100%)',
        pt: 8,
        pb: 6,
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Upload Videos for AI Processing
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 300,
            }}
          >
            Upload one or more videos and we'll automatically remove text, subtitles, and watermarks using advanced AI
            technology.
          </Typography>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              px: 3,
              py: 1.5,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Available Credits: {creditsBalance}
            </Typography>
            <Chip
              label="Free Plan"
              sx={{
                ml: 2,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 2,
                },
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
