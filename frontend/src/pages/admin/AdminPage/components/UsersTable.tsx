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
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { User } from '../types';

interface UsersTableProps {
  users: User[];
  onUserAction: (event: React.MouseEvent<HTMLElement>, user: User) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, onUserAction }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Credits</TableCell>
            <TableCell>Jobs</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Joined</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Box>
                  <Typography variant="subtitle2">
                    {user.first_name} {user.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.company}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip
                  label={user.subscription_tier}
                  size="small"
                  color={user.subscription_tier === 'free' ? 'default' : 'primary'}
                />
              </TableCell>
              <TableCell>{user.credits_balance}</TableCell>
              <TableCell>{user.total_jobs || 0}</TableCell>
              <TableCell>
                <Chip
                  label={user.is_active ? 'Active' : 'Suspended'}
                  size="small"
                  color={user.is_active ? 'success' : 'error'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                <IconButton onClick={(e) => onUserAction(e, user)}>
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
