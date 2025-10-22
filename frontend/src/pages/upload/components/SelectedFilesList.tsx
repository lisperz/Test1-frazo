import React from 'react';
import { Card, CardContent, Box, Avatar, Typography, Alert, Button } from '@mui/material';
import { VideoFile, CloudDone } from '@mui/icons-material';
import FileListItem from './FileListItem';

interface SelectedFilesListProps {
  files: File[];
  displayNames: Record<string, string>;
  uploadError: string;
  uploadingCount: number;
  uploadedCount: number;
  onDisplayNameChange: (fileName: string, newName: string) => void;
  onRemoveFile: (file: File) => void;
  onSubmit: () => void;
}

const SelectedFilesList: React.FC<SelectedFilesListProps> = ({
  files,
  displayNames,
  uploadError,
  uploadingCount,
  uploadedCount,
  onDisplayNameChange,
  onRemoveFile,
  onSubmit,
}) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              mr: 2,
            }}
          >
            <VideoFile />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
            Selected Videos ({files.length})
          </Typography>
        </Box>

        <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 3 }}>
          {files.map((file, index) => (
            <FileListItem
              key={index}
              file={file}
              displayName={displayNames[file.name] || ''}
              onDisplayNameChange={onDisplayNameChange}
              onRemove={onRemoveFile}
            />
          ))}
        </Box>

        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(24,144,255,0.05) 0%, rgba(24,144,255,0.1) 100%)',
            border: '1px solid rgba(24,144,255,0.2)',
          }}
        >
          <Typography variant="body2">
            After clicking "Start Processing", you'll be redirected to your job history where you can monitor the
            status and download the processed videos when ready.
            {files.length > 1 && ` All ${files.length} videos will be processed simultaneously.`}
          </Typography>
        </Alert>

        {uploadError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {uploadError}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onSubmit}
          disabled={files.length === 0 || uploadingCount > 0}
          startIcon={<CloudDone />}
          sx={{
            background:
              uploadingCount > 0
                ? 'linear-gradient(45deg, #52c41a 30%, #73d13d 90%)'
                : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            borderRadius: '25px',
            py: 2,
            fontSize: '1.2rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
            },
            '&:disabled': {
              background: 'linear-gradient(45deg, #a0aec0 30%, #cbd5e0 90%)',
              color: 'white',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {uploadingCount > 0
            ? `Processing... (${uploadedCount}/${uploadingCount})`
            : `Start Processing ${files.length > 1 ? `${files.length} Videos` : 'Video'}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SelectedFilesList;
