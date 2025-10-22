import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { ApiKey } from '../types';

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  generatedApiKey: string;
  showApiKey: boolean;
  onToggleShowApiKey: () => void;
  onCopyApiKey: (key: string) => void;
  onDeleteApiKey: (keyId: string) => void;
  onCreateApiKey: () => void;
  isDeleting: boolean;
}

export const ApiKeysSection: React.FC<ApiKeysSectionProps> = ({
  apiKeys,
  generatedApiKey,
  showApiKey,
  onToggleShowApiKey,
  onCopyApiKey,
  onDeleteApiKey,
  onCreateApiKey,
  isDeleting,
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            API Keys
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateApiKey}
          >
            Create API Key
          </Button>
        </Box>

        {generatedApiKey && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your new API key has been generated:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TextField
                value={generatedApiKey}
                size="small"
                InputProps={{ readOnly: true }}
                sx={{ flexGrow: 1 }}
              />
              <IconButton onClick={() => onCopyApiKey(generatedApiKey)} size="small">
                <ContentCopy />
              </IconButton>
            </Box>
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              Save this key now - you won't be able to see it again!
            </Typography>
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell>{apiKey.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontFamily="monospace">
                        {showApiKey ? apiKey.key : `${apiKey.key.substring(0, 8)}...${apiKey.key.slice(-4)}`}
                      </Typography>
                      <IconButton size="small" onClick={onToggleShowApiKey}>
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton size="small" onClick={() => onCopyApiKey(apiKey.key)}>
                        <ContentCopy />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(apiKey.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => onDeleteApiKey(apiKey.id)}
                      disabled={isDeleting}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
