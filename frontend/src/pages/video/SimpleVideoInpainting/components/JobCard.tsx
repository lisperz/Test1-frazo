import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Fade,
} from '@mui/material';
import {
  Download,
  Delete,
  CheckCircle,
  Error,
  Refresh,
  VideoFile,
} from '@mui/icons-material';
import { ProcessingJob } from '../types';

interface JobCardProps {
  job: ProcessingJob;
  onRemove: (jobId: string) => void;
  onDownload: (downloadUrl: string, filename: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onRemove, onDownload }) => {
  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'uploading':
        return 'info';
      case 'processing':
        return 'warning';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Refresh sx={{ animation: 'spin 2s linear infinite' }} />;
      case 'completed':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      default:
        return <VideoFile />;
    }
  };

  return (
    <Fade in>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {getStatusIcon(job.status)}
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {job.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.fileSize} {job.taskId && `• Task ID: ${job.taskId}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={job.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(job.status)}
                variant="outlined"
              />
              {job.status === 'completed' && job.downloadUrl && (
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => onDownload(job.downloadUrl!, job.filename)}
                  sx={{ px: 3 }}
                >
                  Download
                </Button>
              )}
              <IconButton onClick={() => onRemove(job.id)} color="error" size="small">
                <Delete />
              </IconButton>
            </Box>
          </Box>

          {(job.status === 'uploading' || job.status === 'processing') && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={job.progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {job.status === 'uploading' ? 'Uploading' : 'Processing'}: {job.progress}%
              </Typography>
            </Box>
          )}

          {job.status === 'error' && job.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {job.error}
            </Alert>
          )}

          {job.status === 'completed' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              🎉 Video processing completed! Text has been successfully removed from your video.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default JobCard;
