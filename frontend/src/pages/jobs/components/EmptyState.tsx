import React from 'react';
import { Paper, Typography, Button } from '@mui/material';
import { VideoLibrary, CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  hasFilters: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters }) => {
  const navigate = useNavigate();

  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <VideoLibrary sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {hasFilters ? 'No jobs match your filters' : 'No videos processed yet'}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {hasFilters
          ? 'Try adjusting your search or filter criteria.'
          : 'Upload your first video to get started with AI-powered text removal.'}
      </Typography>
      {!hasFilters && (
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => navigate('/upload')}>
          Upload Video
        </Button>
      )}
    </Paper>
  );
};

export default EmptyState;
