import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  LinearProgress,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  MenuList,
  MenuItem as MenuListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  MoreVert,
  Download,
  Delete,
  Refresh,
  PlayArrow,
  Stop,
  Search,
  FilterList,
  VideoLibrary,
  CloudUpload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { jobsApi } from '../services/api';
import { useWebSocket } from '../contexts/WebSocketContext';

const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Get jobs with pagination
  const { data: jobsData, isLoading, refetch } = useQuery({
    queryKey: ['user-jobs', page, rowsPerPage, searchTerm, statusFilter],
    queryFn: () => jobsApi.getUserJobs({
      offset: page * rowsPerPage,
      limit: rowsPerPage,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
      handleCloseMenu();
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
      handleCloseMenu();
    },
  });

  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, job: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      case 'pending': return 'info';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            My Jobs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your video processing jobs
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => navigate('/upload')}
          >
            Upload Video
          </Button>
        </Box>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are currently {isConnected ? 'connected' : 'disconnected'}. Job statuses may not reflect the latest changes.
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                Showing {jobs.length} of {totalJobs} jobs
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <VideoLibrary sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm || statusFilter !== 'all' ? 'No jobs match your filters' : 'No videos processed yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first video to get started with AI-powered text removal.'
            }
          </Typography>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => navigate('/upload')}
            >
              Upload Video
            </Button>
          )}
        </Paper>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Video</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VideoLibrary sx={{ mr: 2, color: 'grey.400' }} />
                        <Box>
                          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                            {job.display_name || job.original_filename}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(job.file_size || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      {job.status === 'processing' && job.progress !== undefined ? (
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ mb: 0.5, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {job.progress}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {job.status === 'completed' ? '100%' : '-'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.credits_used || job.estimated_credits || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(job.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {job.duration ? formatDuration(job.duration) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {job.status === 'completed' && job.output_url && (
                          <Tooltip title="View Result">
                            <IconButton
                              size="small"
                              onClick={() => window.open(job.output_url, '_blank')}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {job.status === 'completed' && job.output_url && (
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`${job.output_url}?download=1`, '_blank')}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, job)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalJobs}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Card>
      )}

      {/* Job Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuList>
          {selectedJob?.status === 'completed' && selectedJob?.output_url && (
            <MenuListItem
              onClick={() => {
                window.open(selectedJob.output_url, '_blank');
                handleCloseMenu();
              }}
            >
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText>Download Video</ListItemText>
            </MenuListItem>
          )}
          {selectedJob?.status === 'processing' && (
            <MenuListItem
              onClick={() => cancelJobMutation.mutate(selectedJob.id)}
              disabled={cancelJobMutation.isPending}
            >
              <ListItemIcon>
                <Stop />
              </ListItemIcon>
              <ListItemText>Cancel Job</ListItemText>
            </MenuListItem>
          )}
          {['completed', 'failed', 'cancelled'].includes(selectedJob?.status) && (
            <MenuListItem
              onClick={() => deleteJobMutation.mutate(selectedJob.id)}
              disabled={deleteJobMutation.isPending}
            >
              <ListItemIcon>
                <Delete />
              </ListItemIcon>
              <ListItemText>Delete Job</ListItemText>
            </MenuListItem>
          )}
        </MenuList>
      </Menu>
    </Container>
  );
};

export default JobsPage;