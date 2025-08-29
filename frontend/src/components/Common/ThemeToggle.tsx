import React from 'react';
import {
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium' }) => {
  const { darkMode, toggleDarkMode } = useThemeMode();

  return (
    <Tooltip 
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      arrow
    >
      <IconButton
        onClick={toggleDarkMode}
        color="inherit"
        size={size}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={{
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      >
        {darkMode ? (
          <LightMode fontSize={size} />
        ) : (
          <DarkMode fontSize={size} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;