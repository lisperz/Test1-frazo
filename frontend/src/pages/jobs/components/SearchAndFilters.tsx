import React from 'react';
import { Card, CardContent, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';

interface SearchAndFiltersProps {
  searchTerm: string;
  statusFilter: string;
  totalJobs: number;
  currentJobsCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  statusFilter,
  totalJobs,
  currentJobsCount,
  onSearchChange,
  onStatusFilterChange,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                label="Status Filter"
                startAdornment={<FilterList sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {currentJobsCount} of {totalJobs} jobs
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SearchAndFilters;
