import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchText, onSearchChange }) => {
  return (
    <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
      <TextField
        fullWidth
        placeholder="Search translations..."
        variant="outlined"
        size="small"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
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
  );
};

export default SearchBar;
