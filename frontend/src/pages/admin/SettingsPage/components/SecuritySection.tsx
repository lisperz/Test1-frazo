import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { PasswordData } from '../types';

interface SecuritySectionProps {
  passwordData: PasswordData;
  onPasswordChange: (data: PasswordData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  passwordData,
  onPasswordChange,
  onSubmit,
  isLoading,
}) => {
  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Change Password
        </Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => onPasswordChange({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => onPasswordChange({ ...passwordData, newPassword: e.target.value })}
                required
                helperText="At least 6 characters"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => onPasswordChange({ ...passwordData, confirmPassword: e.target.value })}
                required
                error={passwordData.confirmPassword !== '' && !passwordsMatch}
                helperText={
                  passwordData.confirmPassword !== '' && !passwordsMatch
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !passwordsMatch}
            >
              Update Password
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
