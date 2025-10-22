/**
 * Password Fields - Password and confirm password inputs
 */

import React from 'react';
import { Grid, TextField, InputAdornment, IconButton } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { RegisterFormData } from '../hooks/useRegisterForm';

interface PasswordFieldsProps {
  formData: RegisterFormData;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
}

const PasswordFields: React.FC<PasswordFieldsProps> = ({
  formData,
  showPassword,
  showConfirmPassword,
  onChange,
  onTogglePassword,
  onToggleConfirmPassword,
}) => {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={onChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onTogglePassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="At least 6 characters"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={onChange}
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={onToggleConfirmPassword}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
          helperText={
            formData.confirmPassword !== '' && formData.password !== formData.confirmPassword
              ? 'Passwords do not match'
              : ''
          }
        />
      </Grid>
    </Grid>
  );
};

export default PasswordFields;
