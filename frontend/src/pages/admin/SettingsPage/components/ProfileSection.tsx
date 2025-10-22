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
import { Save } from '@mui/icons-material';
import { ProfileData } from '../types';

interface ProfileSectionProps {
  profileData: ProfileData;
  onProfileChange: (data: ProfileData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profileData,
  onProfileChange,
  onSubmit,
  isLoading,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Profile Information
        </Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileData.firstName}
                onChange={(e) => onProfileChange({ ...profileData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileData.lastName}
                onChange={(e) => onProfileChange({ ...profileData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                value={profileData.email}
                disabled
                helperText="Email cannot be changed. Contact support if needed."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company (Optional)"
                value={profileData.company}
                onChange={(e) => onProfileChange({ ...profileData, company: e.target.value })}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
