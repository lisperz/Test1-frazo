import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { NotificationSettings } from '../types';

interface NotificationsSectionProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  onSave: () => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  settings,
  onSettingsChange,
  onSave,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Notification Preferences
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive notifications via email"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      emailNotifications: e.target.checked
                    })}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Job Completion"
              secondary="Notify when video processing is complete"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.jobComplete}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      jobComplete: e.target.checked
                    })}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Job Failures"
              secondary="Notify when video processing fails"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.jobFailed}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      jobFailed: e.target.checked
                    })}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Low Credits"
              secondary="Notify when credit balance is low"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.creditLow}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      creditLow: e.target.checked
                    })}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Newsletter"
              secondary="Receive product updates and tips"
            />
            <ListItemSecondaryAction>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newsletter}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      newsletter: e.target.checked
                    })}
                  />
                }
                label=""
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={<Save />} onClick={onSave}>
            Save Preferences
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
