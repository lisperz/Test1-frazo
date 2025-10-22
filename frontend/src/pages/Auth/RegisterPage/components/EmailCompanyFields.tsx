/**
 * Email & Company Fields - Email and optional company input
 */

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Email, Business } from '@mui/icons-material';
import { RegisterFormData } from '../hooks/useRegisterForm';

interface EmailCompanyFieldsProps {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmailCompanyFields: React.FC<EmailCompanyFieldsProps> = ({ formData, onChange }) => {
  return (
    <>
      <TextField
        fullWidth
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        required
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        label="Company (Optional)"
        name="company"
        value={formData.company}
        onChange={onChange}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Business color="action" />
            </InputAdornment>
          ),
        }}
      />
    </>
  );
};

export default EmailCompanyFields;
