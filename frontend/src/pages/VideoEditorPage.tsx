import React, { useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Box,
  Card,
  Avatar,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import {
  CloudUpload,
  Edit,
  Send,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import VideoUpload from '../components/VideoEditor/VideoUpload';
import GhostCutVideoEditor from '../components/VideoEditor/GhostCutVideoEditor';

const steps = ['Upload Video', 'Edit & Annotate', 'Submit to GhostCut'];

// Custom styled stepper connector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
  },
}));

// Custom step icons
const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: ownerState.active ? 
    'transparent' : 
    ownerState.completed ? 'transparent' : '#e2e8f0',
  background: ownerState.active ?
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    ownerState.completed ? 
    'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 
    '#e2e8f0',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: ownerState.active || ownerState.completed ? 
    '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  fontSize: '1.2rem',
  fontWeight: 600,
}));

function ColorlibStepIcon(props: any) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <CloudUpload />,
    2: <Edit />,
    3: <Send />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      width: '100%'
    }}>
      {activeStep === 0 && (
        <>
          {/* Hero Section */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.9) 100%)',
            pt: 8, pb: 6, color: 'white' 
          }}>
            <Container maxWidth="lg">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ 
                  fontWeight: 700, 
                  mb: 2, 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Video Editor
                </Typography>
                <Typography variant="h6" sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  fontWeight: 300
                }}>
                  Upload a video, draw regions for text removal or protection, and submit to GhostCut API.
                </Typography>
              </Box>
            </Container>
          </Box>

          {/* Main Content */}
          <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Progress Stepper */}
            <Card sx={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              mb: 4,
              overflow: 'hidden'
            }}>
              <Box sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                p: 4
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  mb: 3, 
                  color: '#2d3748',
                  textAlign: 'center'
                }}>
                  Processing Steps
                </Typography>
                <Stepper 
                  alternativeLabel 
                  activeStep={activeStep} 
                  connector={<ColorlibConnector />}
                  sx={{ mb: 2 }}
                >
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel 
                        StepIconComponent={ColorlibStepIcon}
                        sx={{
                          '& .MuiStepLabel-label': {
                            fontWeight: 600,
                            color: index === activeStep ? '#667eea' : '#718096',
                            fontSize: '0.95rem',
                            mt: 1
                          }
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Card>

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

      {activeStep === 1 && videoUrl && (
        <GhostCutVideoEditor
          videoUrl={videoUrl}
          videoFile={videoFile}
          onBack={handleBackToDashboard}
        />
      )}
    </Box>
  );
};

export default VideoEditorPage;