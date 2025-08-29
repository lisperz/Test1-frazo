import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import {
  VideoLibrary,
  CloudUpload,
  AccountBalanceWallet,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SimpleDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.first_name || user?.email || 'User'}!
        </Typography>
      </Box>

      {/* User Info Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Box>
          <Typography>
            <strong>Email:</strong> {user?.email || 'Not available'}
          </Typography>
          <Typography>
            <strong>Plan:</strong> {user?.subscription_tier || 'Free'}
          </Typography>
          <Typography>
            <strong>Credits:</strong> {user?.credits_balance || 0}
          </Typography>
        </Box>
      </Alert>

      {/* Simple Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VideoLibrary color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Videos
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    0
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountBalanceWallet color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography color="text.secondary" variant="subtitle2">
                    Credits
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {user?.credits_balance || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => navigate('/upload')}
            size="large"
          >
            Upload Video
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<VideoLibrary />}
            onClick={() => navigate('/editor')}
            size="large"
          >
            Video Editor
          </Button>
          <Button
            variant="outlined"
            startIcon={<VideoLibrary />}
            onClick={() => navigate('/jobs')}
          >
            View Jobs
          </Button>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/settings')}
          >
            Settings
          </Button>
        </Box>
      </Paper>

      {/* Empty State */}
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
        <VideoLibrary sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No videos processed yet
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload your first video to get started with AI-powered text removal.
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => navigate('/upload')}
        >
          Upload Your First Video
        </Button>
      </Paper>
    </Container>
  );
};

export default SimpleDashboardPage;