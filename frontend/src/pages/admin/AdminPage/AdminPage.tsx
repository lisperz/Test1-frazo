import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard,
  People,
  Work,
  TrendingUp,
  Refresh,
  Warning,
  Computer,
  Analytics,
  Edit,
  Block,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../services/api';
import { StatsCards } from './components/StatsCards';
import { UsersTable } from './components/UsersTable';
import { JobsTable } from './components/JobsTable';
import { OverviewTab } from './components/OverviewTab';
import { DashboardStat, User } from './types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditDialog, setCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getSystemStats,
    refetchInterval: 30000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ limit: 100 }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => adminApi.getAllJobs({ limit: 50 }),
  });

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 10000,
  });

  const suspendUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setAnchorEl(null);
    },
  });

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

  const handleUserAction = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
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

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'success',
      processing: 'warning',
      failed: 'error',
      pending: 'info',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const dashboardStats: DashboardStat[] = [
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

      <StatsCards stats={dashboardStats} />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<Dashboard />} label="Overview" />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<Work />} label="Jobs" />
            <Tab icon={<Analytics />} label="Analytics" />
            <Tab icon={<Computer />} label="System" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <OverviewTab jobs={jobs} health={health} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UsersTable users={users} onUserAction={handleUserAction} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <JobsTable jobs={jobs} getStatusColor={getStatusColor} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>Usage Statistics</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography>Total Jobs Processed</Typography>
              <Typography fontWeight={600}>{stats?.total_jobs || 0}</Typography>
            </Box>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>Storage Usage</Typography>
            <Typography variant="body2">{stats?.storage_used || 0} GB used</Typography>
          </Paper>
        </TabPanel>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => setCreditDialog(true)}>
          <Analytics sx={{ mr: 1}} />
          Adjust Credits
        </MenuItem>
        <MenuItem onClick={() => selectedUser && suspendUserMutation.mutate(selectedUser.id)}>
          <Block sx={{ mr: 1 }} />
          {selectedUser?.is_active ? 'Suspend' : 'Activate'} User
        </MenuItem>
      </Menu>

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
