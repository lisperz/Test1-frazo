import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Button,
  Fade,
} from '@mui/material';
import {
  VideoFile,
  Download,
  CheckCircle,
  Error,
  Refresh,
  Delete,
} from '@mui/icons-material';
import { ProcessingJob } from '../utils/types';

interface JobCardProps {
  job: ProcessingJob;
  onRemove: (jobId: string) => void;
  onDownload: (downloadUrl: string, filename: string) => void;
}

/**
 * Compact job card component for processing status
 */
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
        return <Refresh className="animate-spin" />;
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
        <CardContent>
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
                <Typography variant="subtitle1">{job.filename}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.fileSize} • {job.taskId && `Task ID: ${job.taskId}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={job.status.toUpperCase()} color={getStatusColor(job.status)} size="small" />
              {job.status === 'completed' && job.downloadUrl && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => onDownload(job.downloadUrl!, job.filename)}
                >
                  Download
                </Button>
              )}
              <IconButton size="small" onClick={() => onRemove(job.id)} color="error">
                <Delete />
              </IconButton>
            </Box>
          </Box>

          {/* Progress Bar */}
          {(job.status === 'uploading' || job.status === 'processing') && (
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={job.progress}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {job.status === 'uploading' ? 'Uploading' : 'Processing'}: {job.progress}%
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {job.status === 'error' && job.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {job.error}
            </Alert>
          )}

          {/* Success Message */}
          {job.status === 'completed' && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Video processing completed! Text has been removed from your video.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};

export default JobCard;
