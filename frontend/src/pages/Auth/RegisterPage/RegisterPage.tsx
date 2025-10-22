/**
 * Register Page - User registration
 */

import React from 'react';
import { Box, Container, Paper, Button, Alert, CircularProgress } from '@mui/material';
import { useRegisterForm } from './hooks/useRegisterForm';
import RegisterHeader from './components/RegisterHeader';
import NameFields from './components/NameFields';
import EmailCompanyFields from './components/EmailCompanyFields';
import PasswordFields from './components/PasswordFields';
import RegisterFooter from './components/RegisterFooter';

const RegisterPage: React.FC = () => {
  const {
    formData,
    showPassword,
    showConfirmPassword,
    loading,
    error,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useRegisterForm();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <RegisterHeader />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <NameFields formData={formData} onChange={handleChange} />

            <EmailCompanyFields formData={formData} onChange={handleChange} />

            <PasswordFields
              formData={formData}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onChange={handleChange}
              onTogglePassword={togglePasswordVisibility}
              onToggleConfirmPassword={toggleConfirmPasswordVisibility}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 3,
                mb: 2,
                borderRadius: 2,
                fontWeight: 600,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            <RegisterFooter />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
