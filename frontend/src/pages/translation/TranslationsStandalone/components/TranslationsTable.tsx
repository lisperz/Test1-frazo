import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { SortRounded } from '@mui/icons-material';
import { Translation } from '../types';

interface TranslationsTableProps {
  translations: Translation[];
}

const TranslationsTable: React.FC<TranslationsTableProps> = ({ translations }) => {
  return (
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
            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Images</TableCell>
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
  );
};

export default TranslationsTable;
