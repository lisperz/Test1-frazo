import { createTheme } from '@mui/material';

/**
 * Theme configuration for Translations Page
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            '&:hover': {
              backgroundColor: '#e3f2fd',
            },
          },
        },
      },
    },
  },
});
