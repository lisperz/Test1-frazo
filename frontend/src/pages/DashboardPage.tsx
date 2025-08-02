import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  VideoLibrary,
  CloudUpload,
  TrendingUp,
  AccountBalanceWallet,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  PlayArrow,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { jobsApi, usersApi } from '../services/api';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: usersApi.getUserStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get recent jobs
  const { data: recentJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: () => jobsApi.getUserJobs({ limit: 5 }),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'processing': return <Schedule />;
      case 'failed': return <ErrorIcon />;
      case 'pending': return <Schedule />;
      default: return <Schedule />;
    }
  };

  const dashboardCards = [
    {
      title: 'Total Videos Processed',
      value: stats?.total_jobs || 0,
      icon: <VideoLibrary color="primary" />,
      color: 'primary.main',
    },
    {
      title: 'Credits Remaining',
      value: user?.credits_balance || 0,
      icon: <AccountBalanceWallet color="success" />,
      color: 'success.main',
    },
    {
      title: 'Processing Queue',
      value: stats?.pending_jobs || 0,
      icon: <Schedule color="warning" />,
      color: 'warning.main',
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate || 0}%`,
      icon: <TrendingUp color="info" />,
      color: 'info.main',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.first_name || 'User'}! Here's your account overview.
        </Typography>
      </Box>

      {/* User Subscription Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>
            You're on the <strong>{user?.subscription_tier || 'Free'}</strong> plan with{' '}
            <strong>{user?.credits_balance || 0}</strong> credits remaining.
          </Typography>
          <Button variant="outlined" size="small" onClick={() => navigate('/settings')}>
            Upgrade Plan
          </Button>
        </Box>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="subtitle2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color={card.color}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ fontSize: 40 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
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

          {/* Credit Usage */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Credit Usage This Month
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Used: {stats?.credits_used_this_month || 0}
                  </Typography>
                  <Typography variant="body2">
                    Limit: {stats?.monthly_credit_limit || 'Unlimited'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    ((stats?.credits_used_this_month || 0) / (stats?.monthly_credit_limit || 1000)) * 100,
                    100
                  )}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stats?.monthly_credit_limit && stats?.credits_used_this_month
                  ? `${Math.max(0, stats.monthly_credit_limit - stats.credits_used_this_month)} credits remaining this month`
                  : 'Unlimited usage available'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Jobs */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Jobs
                </Typography>
                <Box>
                  <IconButton onClick={() => refetchJobs()} size="small">
                    <Refresh />
                  </IconButton>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/jobs')}
                    sx={{ ml: 1 }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>

              {recentJobs.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
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
                    Upload Video
                  </Button>
                </Paper>
              ) : (
                <List>
                  {recentJobs.map((job: any) => (
                    <ListItem
                      key={job.id}
                      sx={{
                        border: 1,
                        borderColor: 'grey.200',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        job.status === 'completed' ? (
                          <IconButton
                            edge="end"
                            onClick={() => window.open(job.output_url, '_blank')}
                          >
                            <PlayArrow />
                          </IconButton>
                        ) : null
                      }
                    >
                      <ListItemIcon>
                        {getStatusIcon(job.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" noWrap>
                              {job.display_name || job.original_filename}
                            </Typography>
                            <Chip
                              label={job.status}
                              size="small"
                              color={getStatusColor(job.status) as any}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Created: {new Date(job.created_at).toLocaleDateString()}
                            </Typography>
                            {job.progress !== undefined && job.status === 'processing' && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={job.progress}
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {job.progress}% complete
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;