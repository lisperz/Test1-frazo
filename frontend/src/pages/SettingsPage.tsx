import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save,
  Key,
  Delete,
  Add,
  Check,
  ContentCopy,
  Visibility,
  VisibilityOff,
  CreditCard,
  Security,
  Notifications,
  AccountCircle,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';

const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKeyDialog, setNewApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    company: user?.company || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobComplete: true,
    jobFailed: true,
    creditLow: true,
    newsletter: false,
  });

  // Get API keys
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: usersApi.getApiKeys,
  });

  // Get credit history
  const { data: creditHistory = [] } = useQuery({
    queryKey: ['credit-history'],
    queryFn: () => usersApi.getCreditHistory({ limit: 10 }),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: async (data) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: (name: string) => usersApi.createApiKey(name),
    onSuccess: (data) => {
      setGeneratedApiKey(data.key);
      setNewApiKeyDialog(false);
      setNewApiKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: (keyId: string) => usersApi.deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      company: profileData.company,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    changePasswordMutation.mutate({
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    });
  };

  const handleCreateApiKey = () => {
    if (newApiKeyName.trim()) {
      createApiKeyMutation.mutate(newApiKeyName.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const subscriptionPlans = [
    {
      name: 'Free',
      price: '$0/month',
      credits: '100 credits/month',
      current: user?.subscription_tier === 'free',
    },
    {
      name: 'Pro',
      price: '$29.99/month',
      credits: '1,000 credits/month',
      current: user?.subscription_tier === 'pro',
    },
    {
      name: 'Enterprise',
      price: '$99.99/month',
      credits: '5,000 credits/month',
      current: user?.subscription_tier === 'enterprise',
    },
  ];

  const tabItems = [
    { id: 'profile', label: 'Profile', icon: <AccountCircle /> },
    { id: 'security', label: 'Security', icon: <Security /> },
    { id: 'api', label: 'API Keys', icon: <Key /> },
    { id: 'billing', label: 'Billing & Credits', icon: <CreditCard /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Account Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account preferences and settings
      </Typography>

      <Grid container spacing={4}>
        {/* Sidebar Navigation */}
        <Grid item xs={12} md={3}>
          <Card>
            <List>
              {tabItems.map((tab) => (
                <ListItem
                  key={tab.id}
                  button
                  selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: activeTab === tab.id ? 'primary.main' : 'inherit' }}>
                    {tab.icon}
                  </ListItemIcon>
                  <ListItemText primary={tab.label} />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Profile Information
                </Typography>
                <Box component="form" onSubmit={handleProfileSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={profileData.email}
                        disabled
                        helperText="Email cannot be changed. Contact support if needed."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company (Optional)"
                        value={profileData.company}
                        onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Change Password
                </Typography>
                <Box component="form" onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        helperText="At least 6 characters"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                        helperText={
                          passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'Passwords do not match'
                            : ''
                        }
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={changePasswordMutation.isPending || passwordData.newPassword !== passwordData.confirmPassword}
                    >
                      Update Password
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    API Keys
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setNewApiKeyDialog(true)}
                  >
                    Create API Key
                  </Button>
                </Box>
                
                {generatedApiKey && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Your new API key has been generated:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <TextField
                        value={generatedApiKey}
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ flexGrow: 1 }}
                      />
                      <IconButton onClick={() => copyToClipboard(generatedApiKey)} size="small">
                        <ContentCopy />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                      Save this key now - you won't be able to see it again!
                    </Typography>
                  </Alert>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Key</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Last Used</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiKeys.map((apiKey: any) => (
                        <TableRow key={apiKey.id}>
                          <TableCell>{apiKey.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontFamily="monospace">
                                {showApiKey ? apiKey.key : `${apiKey.key.substring(0, 8)}...${apiKey.key.slice(-4)}`}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(apiKey.key)}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>{new Date(apiKey.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                              disabled={deleteApiKeyMutation.isPending}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Current Plan
                  </Typography>
                  <Grid container spacing={2}>
                    {subscriptionPlans.map((plan) => (
                      <Grid item xs={12} md={4} key={plan.name}>
                        <Paper
                          sx={{
                            p: 2,
                            border: plan.current ? 2 : 1,
                            borderColor: plan.current ? 'primary.main' : 'grey.300',
                            position: 'relative',
                          }}
                        >
                          {plan.current && (
                            <Chip
                              label="Current"
                              color="primary"
                              size="small"
                              sx={{ position: 'absolute', top: -8, right: 8 }}
                            />
                          )}
                          <Typography variant="h6" gutterBottom>{plan.name}</Typography>
                          <Typography variant="h5" color="primary.main" gutterBottom>
                            {plan.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {plan.credits}
                          </Typography>
                          {!plan.current && (
                            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                              Upgrade
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Credit History
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {creditHistory.map((transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.type}
                                size="small"
                                color={transaction.amount > 0 ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography color={transaction.amount > 0 ? 'success.main' : 'error.main'}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                              </Typography>
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.balance_after}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Notification Preferences
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              emailNotifications: e.target.checked
                            })}
                          />
                        }
                        label=""
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Job Completion"
                      secondary="Notify when video processing is complete"
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.jobComplete}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              jobComplete: e.target.checked
                            })}
                          />
                        }
                        label=""
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Job Failures"
                      secondary="Notify when video processing fails"
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.jobFailed}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              jobFailed: e.target.checked
                            })}
                          />
                        }
                        label=""
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Low Credits"
                      secondary="Notify when credit balance is low"
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.creditLow}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              creditLow: e.target.checked
                            })}
                          />
                        }
                        label=""
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Newsletter"
                      secondary="Receive product updates and tips"
                    />
                    <ListItemSecondaryAction>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.newsletter}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              newsletter: e.target.checked
                            })}
                          />
                        }
                        label=""
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                <Box sx={{ mt: 3 }}>
                  <Button variant="contained" startIcon={<Save />}>
                    Save Preferences
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create API Key Dialog */}
      <Dialog open={newApiKeyDialog} onClose={() => setNewApiKeyDialog(false)}>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="API Key Name"
            value={newApiKeyName}
            onChange={(e) => setNewApiKeyName(e.target.value)}
            margin="normal"
            helperText="Give your API key a descriptive name"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewApiKeyDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateApiKey}
            variant="contained"
            disabled={!newApiKeyName.trim() || createApiKeyMutation.isPending}
          >
            Create Key
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SettingsPage;