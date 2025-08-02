import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  Logout,
  CreditCard,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isConnected, jobUpdates } = useWebSocket();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const unreadNotifications = jobUpdates.filter(update => 
    update.type === 'job_completed' || update.type === 'job_failed'
  ).length;

  const getSubscriptionTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free':
        return 'default';
      case 'pro':
        return 'primary';
      case 'enterprise':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          Video Text Inpainting
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>

            {/* Credits */}
            <Chip
              icon={<CreditCard />}
              label={`${user.credits_balance} credits`}
              variant="outlined"
              size="small"
            />

            {/* Subscription Tier */}
            <Chip
              label={user.subscription_tier}
              color={getSubscriptionTierColor(user.subscription_tier) as any}
              size="small"
            />

            {/* Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.first_name ? user.first_name[0] : user.email[0]}
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <Avatar />
            <Box>
              <Typography variant="subtitle2">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => window.location.href = '/settings'}>
            <Settings fontSize="small" sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout fontSize="small" sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
            },
          }}
        >
          {jobUpdates.length === 0 ? (
            <MenuItem>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </MenuItem>
          ) : (
            jobUpdates.slice(0, 5).map((update, index) => (
              <MenuItem key={index} onClick={handleNotificationClose}>
                <Box>
                  <Typography variant="subtitle2">
                    Job {update.type === 'job_completed' ? 'Completed' : 
                         update.type === 'job_failed' ? 'Failed' : 'Updated'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {update.data.message || `Job ${update.job_id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;