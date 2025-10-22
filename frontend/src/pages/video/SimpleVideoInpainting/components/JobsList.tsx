import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { ProcessingJob } from '../types';
import JobCard from './JobCard';

interface JobsListProps {
  jobs: ProcessingJob[];
  onRemoveJob: (jobId: string) => void;
  onDownloadVideo: (downloadUrl: string, filename: string) => void;
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onRemoveJob, onDownloadVideo }) => {
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
          <JobCard
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

export default JobsList;
