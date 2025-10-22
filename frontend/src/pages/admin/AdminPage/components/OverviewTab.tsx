import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Work } from '@mui/icons-material';
import { Job } from '../types';

interface OverviewTabProps {
  jobs: Job[];
  health: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ jobs, health }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Recent Activity
          </Typography>
          <List>
            {jobs.slice(0, 5).map((job) => (
              <ListItem key={job.id}>
                <ListItemIcon>
                  {job.status === 'completed' ? <CheckCircle color="success" /> :
                   job.status === 'failed' ? <ErrorIcon color="error" /> :
                   <Work color="warning" />}
                </ListItemIcon>
                <ListItemText
                  primary={`${job.user_email} - ${job.display_name || job.original_filename}`}
                  secondary={`${job.status} • ${new Date(job.created_at).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            System Resources
          </Typography>
          {['cpu_usage', 'memory_usage', 'disk_usage'].map((metric) => (
            <Box key={metric} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {metric.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Typography>
                <Typography variant="body2">{health?.[metric] || 0}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={health?.[metric] || 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
};
