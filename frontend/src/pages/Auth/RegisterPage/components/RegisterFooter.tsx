/**
 * Register Footer - Footer with login link and terms
 */

import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const RegisterFooter: React.FC = () => {
  return (
    <>
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign in here
          </Link>
        </Typography>
      </Box>

      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
          You'll start with 100 free credits to try our service.
        </Typography>
      </Box>
    </>
  );
};

export default RegisterFooter;
