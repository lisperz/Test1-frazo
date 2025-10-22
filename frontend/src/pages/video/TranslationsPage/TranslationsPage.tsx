import React, { useState } from 'react';
import { Box, Typography, Paper, ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './utils/theme';
import { Translation } from './utils/types';
import { DRAWER_WIDTH } from './utils/constants';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import TranslationsTable from './components/TranslationsTable';
import TablePagination from './components/Pagination';

/**
 * Translations Page
 * Main page for managing translations with sidebar navigation
 * Refactored version with modular components
 */
const TranslationsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('translate');
  const [translations] = useState<Translation[]>([]);
  const [page, setPage] = useState(1);

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.max(Math.ceil(translations.length / 10), 0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar */}
        <Sidebar selectedMenu={selectedMenu} onMenuClick={handleMenuClick} />

        {/* Main Content */}
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
              <SearchBar searchText={searchText} onSearchChange={setSearchText} />
              <TranslationsTable translations={translations} />
              <TablePagination
                totalItems={translations.length}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </Paper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default TranslationsPage;
