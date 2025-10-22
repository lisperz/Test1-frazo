import React from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
} from '@mui/material';
import { SortRounded } from '@mui/icons-material';
import { MenuItem } from '../types';
import { DRAWER_WIDTH } from '../theme/appTheme';

interface AppSidebarProps {
  menuItems: MenuItem[];
  selectedMenu: string;
  onMenuClick: (menuId: string) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ menuItems, selectedMenu, onMenuClick }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'fixed',
          height: '100%',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#1976d2',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              R
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Redaka
            </Typography>
            <Typography variant="caption" color="text.secondary">
              5 credits
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          {['Translate', 'Credits', 'Help & Support'].map((section) => (
            <Box key={section} sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  ml: 1,
                  mb: 1,
                  display: 'block',
                }}
              >
                {section}
              </Typography>
              <List sx={{ py: 0 }}>
                {menuItems
                  .filter((item) => item.section === section)
                  .map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton
                        selected={selectedMenu === item.id}
                        onClick={() => onMenuClick(item.id)}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: selectedMenu === item.id ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#f0f0f0',
              color: '#666',
              fontSize: 14,
              mr: 2,
            }}
          >
            Z
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              Account
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              zhuchen200245@gmail.com
            </Typography>
          </Box>
          <IconButton size="small" sx={{ ml: 1 }}>
            <SortRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AppSidebar;
