import React from 'react';
import {
  Card,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { TabItem } from '../types';

interface SettingsSidebarProps {
  tabItems: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  tabItems,
  activeTab,
  onTabChange,
}) => {
  return (
    <Card>
      <List>
        {tabItems.map((tab) => (
          <ListItem
            key={tab.id}
            button
            selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
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
  );
};
