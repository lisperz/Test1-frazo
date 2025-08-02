import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  CloudUpload,
  Work,
  Settings,
  AdminPanelSettings,
  BarChart,
  CreditCard,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 240;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.subscription_tier === 'enterprise' || 
                  user?.email.includes('admin'); // Simplified admin check

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Upload Video', icon: <CloudUpload />, path: '/upload' },
    { text: 'My Jobs', icon: <Work />, path: '/jobs' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  if (isAdmin) {
    menuItems.push(
      { text: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin' }
    );
  }

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary.main">
          VTI Service
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Welcome back
        </Typography>
        <Typography variant="h6" noWrap>
          {user?.first_name || 'User'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
          <CreditCard fontSize="small" color="primary" />
          <Typography variant="body2" color="text.secondary">
            {user?.credits_balance || 0} credits
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  minHeight: 48,
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2,
                    color: isActive ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'primary.main' : 'inherit',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* Usage Stats */}
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Typography variant="caption" color="text.secondary">
          Subscription: {user?.subscription_tier || 'Free'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;