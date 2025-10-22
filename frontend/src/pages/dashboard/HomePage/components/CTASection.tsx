/**
 * CTA Section - Call to Action section
 */

import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        sx={{
          p: 6,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Ready to Remove Text from Your Videos?
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Join thousands of content creators using our AI-powered service
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/register')}
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
            px: 4,
            py: 1.5,
          }}
        >
          Start Free Trial
        </Button>
      </Paper>
    </Box>
  );
};

export default CTASection;
