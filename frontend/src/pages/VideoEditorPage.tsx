import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import { Upload, Edit, Send, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext'; // Temporarily disabled
import VideoUpload from '../components/VideoEditor/VideoUpload';
// import LSFEditor from '../components/VideoEditor/LSFEditor';
import SimpleVideoEditor from '../components/VideoEditor/SimpleVideoEditor';
import JobStatusCard from '../components/VideoEditor/JobStatusCard';
import { VideoAnnotation, GhostCutJobResponse } from '../types/videoEditor';
import { submitGhostCutJob, getJobStatus } from '../services/ghostcutApi';

const steps = ['Upload Video', 'Edit & Annotate', 'Process', 'Download'];

const VideoEditorPage: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth(); // Temporarily disabled
  
  const [activeStep, setActiveStep] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [currentJob, setCurrentJob] = useState<GhostCutJobResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUpload = useCallback((file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    setActiveStep(1);
    setError(null);
  }, []);

  const handleAutoProcess = useCallback(async (file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    setError(null);
    setActiveStep(2);
    setIsProcessing(true);

    try {
      // Submit for automatic text detection and removal
      const jobResponse = await submitGhostCutJob({
        videoUrl: url,
        annotations: [], // Empty annotations for automatic processing
        language: 'auto',
        autoDetectText: true, // Flag for automatic text detection
      });

      setCurrentJob(jobResponse);
      
      // Start polling for job status
      pollJobStatus(jobResponse.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
      setIsProcessing(false);
      setActiveStep(0);
    }
  }, []);

  const handleAnnotationsChange = useCallback((newAnnotations: VideoAnnotation[]) => {
    setAnnotations(newAnnotations);
  }, []);

  const handleSubmit = async () => {
    if (!videoUrl || annotations.length === 0) {
      setError('Please add at least one annotation before submitting');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setActiveStep(2);

    try {
      const jobResponse = await submitGhostCutJob({
        videoUrl,
        annotations,
        language: 'auto',
      });

      setCurrentJob(jobResponse);
      
      // Start polling for job status
      pollJobStatus(jobResponse.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
      setIsProcessing(false);
      setActiveStep(1);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        setCurrentJob(status);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          setActiveStep(3);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          setError(status.error || 'Job processing failed');
          setActiveStep(1);
        }
      } catch (err) {
        clearInterval(pollInterval);
        setError('Failed to fetch job status');
        setIsProcessing(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleReset = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setAnnotations([]);
    setCurrentJob(null);
    setIsProcessing(false);
    setError(null);
    setActiveStep(0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Video Editor
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload a video, mark areas for text removal or protection, and process with AI-powered inpainting.
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

        <Box sx={{ minHeight: 400 }}>
          {activeStep === 0 && (
            <VideoUpload 
              onUpload={handleVideoUpload} 
              onAutoProcess={handleAutoProcess}
            />
          )}

          {activeStep === 1 && videoUrl && (
            <Box>
              <SimpleVideoEditor
                videoUrl={videoUrl}
                videoFile={videoFile}
                onAnnotationsChange={handleAnnotationsChange}
              />
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={annotations.length === 0}
                >
                  Submit for Processing
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && currentJob && (
            <Box sx={{ textAlign: 'center' }}>
              <JobStatusCard job={currentJob} />
              {isProcessing && (
                <Box sx={{ mt: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Processing your video...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {activeStep === 3 && currentJob?.outputUrl && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Processing Complete!
              </Typography>
              <Typography variant="body1" paragraph>
                Your video has been processed successfully.
              </Typography>
              <Grid container spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Download />}
                    href={currentJob.outputUrl}
                    target="_blank"
                  >
                    Download Processed Video
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                  >
                    Process Another Video
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoEditorPage;