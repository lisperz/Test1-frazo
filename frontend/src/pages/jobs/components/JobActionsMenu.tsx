import React from 'react';
import { Menu, MenuList, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Download, Stop, Delete } from '@mui/icons-material';
import { Job } from '../types';

interface JobActionsMenuProps {
  anchorEl: HTMLElement | null;
  selectedJob: Job | null;
  onClose: () => void;
  onCancelJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  isCancelling: boolean;
  isDeleting: boolean;
}

const JobActionsMenu: React.FC<JobActionsMenuProps> = ({
  anchorEl,
  selectedJob,
  onClose,
  onCancelJob,
  onDeleteJob,
  isCancelling,
  isDeleting,
}) => {
  const handleDownload = () => {
    if (selectedJob?.output_url) {
      window.open(selectedJob.output_url, '_blank');
      onClose();
    }
  };

  const handleCancel = () => {
    if (selectedJob?.id) {
      onCancelJob(selectedJob.id);
    }
  };

  const handleDelete = () => {
    if (selectedJob?.id) {
      onDeleteJob(selectedJob.id);
    }
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuList>
        {selectedJob?.status === 'completed' && selectedJob?.output_url && (
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <Download />
            </ListItemIcon>
            <ListItemText>Download Video</ListItemText>
          </MenuItem>
        )}
        {selectedJob?.status === 'processing' && (
          <MenuItem onClick={handleCancel} disabled={isCancelling}>
            <ListItemIcon>
              <Stop />
            </ListItemIcon>
            <ListItemText>Cancel Job</ListItemText>
          </MenuItem>
        )}
        {selectedJob?.status && ['completed', 'failed', 'cancelled'].includes(selectedJob.status) && (
          <MenuItem onClick={handleDelete} disabled={isDeleting}>
            <ListItemIcon>
              <Delete />
            </ListItemIcon>
            <ListItemText>Delete Job</ListItemText>
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
};

export default JobActionsMenu;
