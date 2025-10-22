import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { ProcessingJob } from '../utils/types';
import JobCard from './JobCard';

interface JobsListProps {
  jobs: ProcessingJob[];
  onRemoveJob: (jobId: string) => void;
  onDownloadVideo: (downloadUrl: string, filename: string) => void;
}

/**
 * Jobs list component
 * Displays processing queue with all jobs
 */
const JobsList: React.FC<JobsListProps> = ({ jobs, onRemoveJob, onDownloadVideo }) => {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Processing Queue
      </Typography>
      <Stack spacing={2}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onRemove={onRemoveJob} onDownload={onDownloadVideo} />
        ))}
      </Stack>
    </Box>
  );
};

export default JobsList;
