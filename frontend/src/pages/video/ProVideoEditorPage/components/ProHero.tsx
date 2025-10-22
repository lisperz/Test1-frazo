/**
 * Pro Hero - Hero section for Pro Video Editor
 */

import React from 'react';
import { Box, Container, Typography, Chip } from '@mui/material';
import { Star } from '@mui/icons-material';

const ProHero: React.FC = () => {
  return (
    <Box sx={{
      background: 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(217,119,6,0.9) 100%)',
      pt: 8, pb: 6, color: 'white'
    }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Typography variant="h2" sx={{
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              mr: 2,
            }}>
              Pro Video Editor
            </Typography>
            <Chip
              icon={<Star />}
              label="PRO"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                height: 40,
              }}
            />
          </Box>
          <Typography variant="h6" sx={{
            mb: 4,
            opacity: 0.9,
            fontSize: { xs: '1rem', md: '1.25rem' },
            fontWeight: 300
          }}>
            Advanced segment-based lip-sync with multiple audio inputs and timeline control
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ProHero;
