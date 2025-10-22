import React from 'react';
import { Card, CardContent, Box, Avatar, Typography, TextField, Button } from '@mui/material';
import { VideoFile } from '@mui/icons-material';
import { formatFileSize } from '../utils/formatters';

interface FileListItemProps {
  file: File;
  displayName: string;
  onDisplayNameChange: (fileName: string, newName: string) => void;
  onRemove: (file: File) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  displayName,
  onDisplayNameChange,
  onRemove,
}) => {
  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            mr: 2,
          }}
        >
          <VideoFile />
        </Avatar>
        <Box sx={{ flexGrow: 1, mr: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
            {file.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatFileSize(file.size)}
          </Typography>
        </Box>
        <TextField
          size="small"
          label="Display Name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(file.name, e.target.value)}
          sx={{
            mr: 2,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          }}
        />
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => onRemove(file)}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Remove
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileListItem;
