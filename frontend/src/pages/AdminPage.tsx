import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Dashboard,
  People,
  Work,
  TrendingUp,
  MoreVert,
  Block,
  CheckCircle,
  Error as ErrorIcon,
  Delete,
  Edit,
  Refresh,
  Download,
  Analytics,
  Storage,
  Computer,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get admin stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getSystemStats,
    refetchInterval: 30000,
  });

  // Get all users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ limit: 100 }),
  });

  // Get all jobs
  const { data: jobsData } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => adminApi.getAllJobs({ limit: 50 }),
  });

  // Get system health
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 10000,
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      handleCloseMenu();
    },
  });

  // Adjust credits mutation
  const adjustCreditsMutation = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      adminApi.adjustUserCredits(userId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreditDialog(false);
      setCreditAmount('');
      setCreditReason('');
    },
  });

  const users = usersData?.users || [];
  const jobs = jobsData?.jobs || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleAdjustCredits = () => {
    if (selectedUser && creditAmount && creditReason) {
      adjustCreditsMutation.mutate({
        userId: selectedUser.id,
        amount: parseInt(creditAmount),
        reason: creditReason,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      case 'pending': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const dashboardStats = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: <People color="primary" />,
      color: 'primary.main',
    },
    {
      title: 'Active Jobs',
      value: stats?.active_jobs || 0,
      icon: <Work color="warning" />,
      color: 'warning.main',
    },
    {
      title: 'Jobs Today',
      value: stats?.jobs_today || 0,
      icon: <TrendingUp color="success" />,
      color: 'success.main',
    },
    {
      title: 'System Load',
      value: `${stats?.system_load || 0}%`,
      icon: <Computer color="info" />,
      color: 'info.main',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System administration and monitoring
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => queryClient.invalidateQueries()}
        >
          Refresh All
        </Button>
      </Box>

      {/* System Health Alert */}
      {health && health.status !== 'healthy' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning />
            <Typography>
              System health check detected issues: {health.issues?.join(', ')}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="subtitle2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color={stat.color}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ fontSize: 40 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<Dashboard />} label="Overview" />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<Work />} label="Jobs" />
            <Tab icon={<Analytics />} label="Analytics" />
            <Tab icon={<Computer />} label="System" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Recent Activity
                </Typography>
                <List>
                  {jobs.slice(0, 5).map((job: any) => (
                    <ListItem key={job.id}>
                      <ListItemIcon>
                        {job.status === 'completed' ? <CheckCircle color="success" /> : 
                         job.status === 'failed' ? <ErrorIcon color="error" /> :
                         <Work color="warning" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={`${job.user_email} - ${job.display_name || job.original_filename}`}
                        secondary={`${job.status} • ${new Date(job.created_at).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  System Resources
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">CPU Usage</Typography>
                    <Typography variant="body2">{health?.cpu_usage || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={health?.cpu_usage || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Memory Usage</Typography>
                    <Typography variant="body2">{health?.memory_usage || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={health?.memory_usage || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Disk Usage</Typography>
                    <Typography variant="body2">{health?.disk_usage || 0}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={health?.disk_usage || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Jobs</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.company}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.subscription_tier}
                        size="small"
                        color={user.subscription_tier === 'free' ? 'default' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>{user.credits_balance}</TableCell>
                    <TableCell>{user.total_jobs || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Suspended'}
                        size="small"
                        color={user.is_active ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Jobs Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {job.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{job.user_email}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {job.display_name || job.original_filename}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {job.status === 'processing' && job.progress !== undefined ? (
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">{job.progress}%</Typography>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{job.credits_used || job.estimated_credits || '-'}</TableCell>
                    <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Usage Statistics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Total Jobs Processed</Typography>
                  <Typography fontWeight={600}>{stats?.total_jobs || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Success Rate</Typography>
                  <Typography fontWeight={600}>{stats?.success_rate || 0}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Average Processing Time</Typography>
                  <Typography fontWeight={600}>{stats?.avg_processing_time || 0}min</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total Credits Used</Typography>
                  <Typography fontWeight={600}>{stats?.total_credits_used || 0}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Revenue Metrics
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Monthly Revenue</Typography>
                  <Typography fontWeight={600}>${stats?.monthly_revenue || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Active Subscriptions</Typography>
                  <Typography fontWeight={600}>{stats?.active_subscriptions || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Conversion Rate</Typography>
                  <Typography fontWeight={600}>{stats?.conversion_rate || 0}%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Churn Rate</Typography>
                  <Typography fontWeight={600}>{stats?.churn_rate || 0}%</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Service Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="API Server" secondary="Running" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Database" secondary="Connected" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Redis Cache" secondary="Connected" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Celery Workers" secondary="Active" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Storage Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Video Storage</Typography>
                    <Typography variant="body2">{stats?.storage_used || 0} GB</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((stats?.storage_used || 0) / (stats?.storage_total || 100)) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Database Size</Typography>
                    <Typography variant="body2">{stats?.db_size || 0} MB</Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Cache Usage</Typography>
                    <Typography variant="body2">{stats?.cache_usage || 0} MB</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* User Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => setUserDialog(true)}>
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={() => setCreditDialog(true)}>
          <Analytics sx={{ mr: 1 }} />
          Adjust Credits
        </MenuItem>
        <MenuItem onClick={() => suspendUserMutation.mutate(selectedUser?.id)}>
          <Block sx={{ mr: 1 }} />
          {selectedUser?.is_active ? 'Suspend' : 'Activate'} User
        </MenuItem>
      </Menu>

      {/* Adjust Credits Dialog */}
      <Dialog open={creditDialog} onClose={() => setCreditDialog(false)}>
        <DialogTitle>Adjust User Credits</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Credit Amount"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            margin="normal"
            helperText="Use negative numbers to deduct credits"
          />
          <TextField
            fullWidth
            label="Reason"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAdjustCredits}
            variant="contained"
            disabled={!creditAmount || !creditReason || adjustCreditsMutation.isPending}
          >
            Adjust Credits
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;