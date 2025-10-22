import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SuccessSnackbarProps {
  open: boolean;
  fileCount: number;
  onClose: () => void;
}

const SuccessSnackbar: React.FC<SuccessSnackbarProps> = ({ open, fileCount, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={1500}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="success"
        sx={{
          width: '100%',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white',
          },
        }}
      >
        {fileCount > 1
          ? `All ${fileCount} videos submitted successfully! Redirecting to job history...`
          : 'Video submitted successfully! Redirecting to job history...'}
      </Alert>
    </Snackbar>
  );
};

export default SuccessSnackbar;
