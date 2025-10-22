/**
 * Register Header - Header section for register page
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

const RegisterHeader: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Create Your Account
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Start removing text from your videos with AI technology
      </Typography>
    </Box>
  );
};

export default RegisterHeader;
