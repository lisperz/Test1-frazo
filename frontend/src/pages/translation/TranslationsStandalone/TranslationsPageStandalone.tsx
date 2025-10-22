import React, { useState } from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { appTheme } from './theme/appTheme';
import { Translation } from './types';
import { useMenuItems } from './hooks/useMenuItems';
import AppSidebar from './components/AppSidebar';
import MainContent from './components/MainContent';

const TranslationsPageStandalone: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('translate');
  const [translations] = useState<Translation[]>([]);
  const [page, setPage] = useState(1);

  const menuItems = useMenuItems();

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
  };

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppSidebar
          menuItems={menuItems}
          selectedMenu={selectedMenu}
          onMenuClick={handleMenuClick}
        />
        <MainContent
          translations={translations}
          searchText={searchText}
          page={page}
          onSearchChange={setSearchText}
          onPageChange={setPage}
        />
      </Box>
    </ThemeProvider>
  );
};

export default TranslationsPageStandalone;
