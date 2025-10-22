import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for translations table
 */
const TablePagination: React.FC<PaginationProps> = ({
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
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
        Showing 1 to {totalItems} of {totalItems} translation(s)
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          size="small"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          size="small"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default TablePagination;
