import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface JobsHeaderProps {
  onRefresh: () => void;
}

const JobsHeader: React.FC<JobsHeaderProps> = ({ onRefresh }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 4 }}>
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          My Jobs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your video processing jobs
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
        <Button variant="outlined" startIcon={<Refresh />} onClick={onRefresh}>
          Refresh
        </Button>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => navigate('/upload')}>
          Upload Video
        </Button>
      </Box>
    </Box>
  );
};

export default JobsHeader;
