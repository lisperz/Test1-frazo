import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

interface CreateApiKeyDialogProps {
  open: boolean;
  apiKeyName: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
  isCreating: boolean;
}

export const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = ({
  open,
  apiKeyName,
  onNameChange,
  onClose,
  onCreate,
  isCreating,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New API Key</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="API Key Name"
          value={apiKeyName}
          onChange={(e) => onNameChange(e.target.value)}
          margin="normal"
          helperText="Give your API key a descriptive name"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onCreate}
          variant="contained"
          disabled={!apiKeyName.trim() || isCreating}
        >
          Create Key
        </Button>
      </DialogActions>
    </Dialog>
  );
};
