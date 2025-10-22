import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { ProcessingJob } from '../utils/types';
import ProcessingJobCard from './ProcessingJobCard';

interface ProcessingJobsListProps {
  jobs: ProcessingJob[];
  onRemoveJob: (jobId: string) => void;
  onDownloadVideo: (downloadUrl: string, filename: string) => void;
}

/**
 * List of processing jobs
 * Displays all video processing jobs with their current status
 */
const ProcessingJobsList: React.FC<ProcessingJobsListProps> = ({
  jobs,
  onRemoveJob,
  onDownloadVideo,
}) => {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Processing Status
      </Typography>
      <Stack spacing={3}>
        {jobs.map((job) => (
          <ProcessingJobCard
            key={job.id}
            job={job}
            onRemove={onRemoveJob}
            onDownload={onDownloadVideo}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default ProcessingJobsList;
