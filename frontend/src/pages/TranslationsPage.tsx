import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Button,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Search,
  Translate,
  History,
  CreditCard,
  Help,
  Description,
  LiveHelp,
  ContactSupport,
  SortRounded,
  Image as ImageIcon,
} from '@mui/icons-material';

const theme = createTheme({
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

const DRAWER_WIDTH = 280;

interface Translation {
  id: string;
  name: string;
  created: string;
  images: number;
}

const TranslationsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('translate');
  const [translations] = useState<Translation[]>([]);
  const [page, setPage] = useState(1);

  const menuItems = [
    {
      id: 'translate',
      label: 'Translate',
      icon: <Translate />,
      section: 'Translate',
    },
    {
      id: 'history',
      label: 'Translation History',
      icon: <History />,
      section: 'Translate',
    },
    {
      id: 'credits',
      label: 'Credits',
      icon: <CreditCard />,
      section: 'Credits',
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: <Description />,
      section: 'Help & Support',
    },
    {
      id: 'faq',
      label: 'FAQ',
      icon: <LiveHelp />,
      section: 'Help & Support',
    },
    {
      id: 'support',
      label: 'Support',
      icon: <ContactSupport />,
      section: 'Help & Support',
    },
  ];

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const renderSidebar = () => (
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
                        onClick={() => handleMenuClick(item.id)}
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

  const renderMainContent = () => (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        ml: `${DRAWER_WIDTH}px`,
        backgroundColor: 'background.default',
        minHeight: '100vh',
      }}
    >
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mr: 2 }}>
            Translations
          </Typography>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              fullWidth
              placeholder="Search translations..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Created
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <SortRounded fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Name
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <SortRounded fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Images
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {translations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 8 }}>
                      <Typography color="text.secondary" sx={{ fontSize: 16 }}>
                        No translations found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  translations.map((translation) => (
                    <TableRow key={translation.id} hover>
                      <TableCell>{translation.created}</TableCell>
                      <TableCell>{translation.name}</TableCell>
                      <TableCell>{translation.images}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing 1 to 0 of 0 translation(s)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Page 1 of 0
              </Typography>
              <Button size="small" disabled>
                Previous
              </Button>
              <Button size="small" disabled>
                Next
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {renderSidebar()}
        {renderMainContent()}
      </Box>
    </ThemeProvider>
  );
};

export default TranslationsPage;