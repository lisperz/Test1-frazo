import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const BasicDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Get user from localStorage to avoid any context issues
  const userStr = localStorage.getItem('user');
  let userEmail = 'User';
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      userEmail = user?.email || 'User';
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {userEmail}!
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/editor')}
            size="large"
          >
            Open Video Editor
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/upload')}
          >
            Upload Video
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/jobs')}
          >
            View Jobs
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Video Text Inpainting Service! Here's how to get started:
        </Typography>
        <ol>
          <li>Click "Open Video Editor" to start removing text from videos</li>
          <li>Upload a video file</li>
          <li>Draw rectangles around the text you want to remove</li>
          <li>Submit for processing</li>
        </ol>
      </Paper>
    </Container>
  );
};

export default BasicDashboardPage;