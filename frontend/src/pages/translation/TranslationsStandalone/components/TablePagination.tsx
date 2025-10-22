import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface TablePaginationProps {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalItems,
  onPageChange,
}) => {
  const totalPages = Math.max(0, Math.ceil(totalItems / 10));

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
          Page {page} of {totalPages}
        </Typography>
        <Button
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default TablePagination;
