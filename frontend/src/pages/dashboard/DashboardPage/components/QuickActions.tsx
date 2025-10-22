/**
 * Quick Actions - Dashboard quick action buttons
 */

import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { CloudUpload, VideoLibrary } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<CloudUpload />}
            onClick={() => navigate('/upload')}
            size="large"
          >
            Upload New Video
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<VideoLibrary />}
            onClick={() => navigate('/jobs')}
          >
            View All Jobs
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/settings')}
          >
            Account Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
