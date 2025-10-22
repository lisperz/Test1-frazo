/**
 * Pro Video Editor Page - Entry point for segment-based lip-sync editing
 */

import React, { useState, useCallback } from 'react';
import { Box, Container, Card, Alert } from '@mui/material';
import { useProAccess } from './hooks/useProAccess';
import UpgradePrompt from './components/UpgradePrompt';
import ProHero from './components/ProHero';
import ProStepper from './components/ProStepper';
import VideoUpload from '../../../components/VideoEditor/VideoUpload';
import ProVideoEditor from '../../../components/VideoEditor/Pro/ProVideoEditor';

const steps = ['Upload Video', 'Add Segments', 'Process with AI'];

const ProVideoEditorPage: React.FC = () => {
  const { hasProAccess, userTierName } = useProAccess();
  const [activeStep, setActiveStep] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUpload = useCallback((file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    setActiveStep(1);
    setError(null);
  }, []);

  // Show upgrade message if user doesn't have Pro access
  if (!hasProAccess) {
    return <UpgradePrompt userTierName={userTierName} />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      width: '100%'
    }}>
      {activeStep === 0 && (
        <>
          {/* Hero Section */}
          <ProHero />

          {/* Main Content */}
          <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Progress Stepper */}
            <ProStepper activeStep={activeStep} steps={steps} />

            {/* Error Display */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 4,
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(239,68,68,0.15)'
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Upload Area */}
            <Card sx={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}>
              <VideoUpload onUpload={handleVideoUpload} />
            </Card>
          </Container>
        </>
      )}

      {activeStep === 1 && videoUrl && videoFile && (
        <ProVideoEditor
          videoUrl={videoUrl}
          videoFile={videoFile}
          onBack={() => setActiveStep(0)}
        />
      )}
    </Box>
  );
};

export default ProVideoEditorPage;
