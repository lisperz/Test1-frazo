import React from 'react';
import { Card, Box, Avatar, Typography, CardContent, Button } from '@mui/material';
import { VideoFile, PlayArrow, Delete } from '@mui/icons-material';
import { formatFileSize } from '../utils/fileValidation';

interface FileReadyCardProps {
  file: File;
  onProceed: () => void;
  onRemove: () => void;
}

const FileReadyCard: React.FC<FileReadyCardProps> = ({ file, onProceed, onRemove }) => {
  return (
    <Card
      sx={{
        mt: 4,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
          p: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              background: 'rgba(255,255,255,0.2)',
              mr: 2,
              width: 48,
              height: 48,
            }}
          >
            <VideoFile sx={{ fontSize: 24 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Video Ready for Processing
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {file.name} ({formatFileSize(file.size)})
            </Typography>
          </Box>
          <Avatar
            sx={{
              background: 'rgba(255,255,255,0.2)',
              width: 40,
              height: 40,
            }}
          >
            <PlayArrow />
          </Avatar>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ color: '#2d3748', mb: 3 }}>
          Your video has been successfully uploaded and is ready for editing. Click "Manual Edit &
          Annotate" to proceed to the editor where you can mark specific areas for text removal.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={onProceed}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              borderRadius: '25px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #667eea 60%, #764ba2 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Manual Edit & Annotate
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Delete />}
            onClick={onRemove}
            sx={{
              borderColor: '#ff4d4f',
              color: '#ff4d4f',
              borderRadius: '25px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#ff7875',
                backgroundColor: 'rgba(255,77,79,0.05)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Remove & Try Again
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileReadyCard;
