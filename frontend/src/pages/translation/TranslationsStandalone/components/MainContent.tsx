import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Translation } from '../types';
import { DRAWER_WIDTH } from '../theme/appTheme';
import SearchBar from './SearchBar';
import TranslationsTable from './TranslationsTable';
import TablePagination from './TablePagination';

interface MainContentProps {
  translations: Translation[];
  searchText: string;
  page: number;
  onSearchChange: (text: string) => void;
  onPageChange: (page: number) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  translations,
  searchText,
  page,
  onSearchChange,
  onPageChange,
}) => {
  return (
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
          <SearchBar searchText={searchText} onSearchChange={onSearchChange} />
          <TranslationsTable translations={translations} />
          <TablePagination
            page={page}
            totalItems={translations.length}
            onPageChange={onPageChange}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default MainContent;
