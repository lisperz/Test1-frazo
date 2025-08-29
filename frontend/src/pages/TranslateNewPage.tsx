import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
} from '@mui/material';
import FileUploadZone from '../components/Upload/FileUploadZone';

const TranslateNewPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    console.log('Selected file:', file);
    // Here you would typically start the translation process
    // or navigate to a preview/processing page
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: 6,
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            textAlign: 'center',
            mb: 4,
          }}
        >
          Video Text Inpainting
        </Typography>
        
        <FileUploadZone
          onFileSelect={handleFileSelect}
          title="Upload Video"
          subtitle="Drag video here, or click to browse"
          supportedFormats="VIDEO/MP4, VIDEO/AVI, VIDEO/MOV, VIDEO/WMV, VIDEO/WEBM (Max 100MB)"
          acceptedFileTypes={{
            'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
          }}
          maxFileSize={104857600} // 100MB
        />
        
        {selectedFile && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default TranslateNewPage;