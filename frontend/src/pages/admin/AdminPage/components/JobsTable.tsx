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
  Chip,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { Job } from '../types';

interface JobsTableProps {
  jobs: Job[];
  getStatusColor: (status: string) => string;
}

export const JobsTable: React.FC<JobsTableProps> = ({ jobs, getStatusColor }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Job ID</TableCell>
            <TableCell>User</TableCell>
            <TableCell>File</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Progress</TableCell>
            <TableCell>Credits</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {job.id.substring(0, 8)}...
                </Typography>
              </TableCell>
              <TableCell>{job.user_email}</TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {job.display_name || job.original_filename}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={job.status}
                  size="small"
                  color={getStatusColor(job.status) as any}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {job.status === 'processing' && job.progress !== undefined ? (
                  <Box sx={{ minWidth: 100 }}>
                    <LinearProgress
                      variant="determinate"
                      value={job.progress}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption">{job.progress}%</Typography>
                  </Box>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{job.credits_used || job.estimated_credits || '-'}</TableCell>
              <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
