import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  PlayCircle,
} from '@mui/icons-material';
import { GhostCutJobResponse } from '../../types/videoEditor';

interface JobStatusCardProps {
  job: GhostCutJobResponse;
}

const JobStatusCard: React.FC<JobStatusCardProps> = ({ job }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'queued':
        return <HourglassEmpty color="info" />;
      case 'processing':
        return <PlayCircle color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'queued':
        return 'info';
      case 'processing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {getStatusIcon()}
          <Typography variant="h6" sx={{ ml: 1 }}>
            Job Status
          </Typography>
          <Chip
            label={job.status.toUpperCase()}
            color={getStatusColor()}
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Job ID: {job.jobId}
        </Typography>

        {job.message && (
          <Typography variant="body1" sx={{ my: 2 }}>
            {job.message}
          </Typography>
        )}

        {job.progress !== undefined && job.status === 'processing' && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Progress</Typography>
              <Typography variant="body2">{job.progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={job.progress} />
          </Box>
        )}

        {job.error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Error: {job.error}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default JobStatusCard;