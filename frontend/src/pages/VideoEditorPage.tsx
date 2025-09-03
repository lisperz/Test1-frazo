import React, { useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VideoUpload from '../components/VideoEditor/VideoUpload';
import GhostCutVideoEditor from '../components/VideoEditor/GhostCutVideoEditor';

const steps = ['Upload Video', 'Edit & Annotate', 'Submit to GhostCut'];

const VideoEditorPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container maxWidth={false} sx={{ p: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {activeStep === 0 && (
        <Paper sx={{ p: 4, m: 4 }}>
          <Typography variant="h4" gutterBottom>
            Video Editor - GhostCut Integration
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Upload a video, draw regions for text removal or protection, and submit to GhostCut API.
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <VideoUpload onUpload={handleVideoUpload} />
        </Paper>
      )}

      {activeStep === 1 && videoUrl && (
        <GhostCutVideoEditor
          videoUrl={videoUrl}
          videoFile={videoFile}
          onBack={handleBackToDashboard}
        />
      )}
    </Container>
  );
};

export default VideoEditorPage;