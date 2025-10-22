/**
 * Name Fields - First and last name input fields
 */

import React from 'react';
import { Grid, TextField, InputAdornment } from '@mui/material';
import { Person } from '@mui/icons-material';
import { RegisterFormData } from '../hooks/useRegisterForm';

interface NameFieldsProps {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NameFields: React.FC<NameFieldsProps> = ({ formData, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={onChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
    </Grid>
  );
};

export default NameFields;
