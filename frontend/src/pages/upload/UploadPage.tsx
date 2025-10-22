import React from 'react';
import { Container, Box, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useFileUpload } from './hooks/useFileUpload';
import HeroSection from './components/HeroSection';
import DropZone from './components/DropZone';
import SelectedFilesList from './components/SelectedFilesList';
import InfoPanel from './components/InfoPanel';
import SuccessSnackbar from './components/SuccessSnackbar';

const UploadPage: React.FC = () => {
  const { user } = useAuth();
  const {
    selectedFiles,
    displayNames,
    uploadError,
    showSuccess,
    uploadingCount,
    uploadedCount,
    onDrop,
    handleRemoveFile,
    handleDisplayNameChange,
    handleSubmit,
    setShowSuccess,
  } = useFileUpload();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        width: '100%',
      }}
    >
      <HeroSection creditsBalance={user?.credits_balance || 100} />

      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={9}>
            {selectedFiles.length === 0 ? (
              <DropZone onDrop={onDrop} />
            ) : (
              <SelectedFilesList
                files={selectedFiles}
                displayNames={displayNames}
                uploadError={uploadError}
                uploadingCount={uploadingCount}
                uploadedCount={uploadedCount}
                onDisplayNameChange={handleDisplayNameChange}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmit}
              />
            )}
          </Grid>

          <Grid item xs={12} lg={3}>
            <InfoPanel />
          </Grid>
        </Grid>
      </Container>

      <SuccessSnackbar open={showSuccess} fileCount={selectedFiles.length} onClose={() => setShowSuccess(false)} />
    </Box>
  );
};

export default UploadPage;
