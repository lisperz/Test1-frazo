/**
 * Pro Video Editor Page - Entry point for segment-based lip-sync editing
 * Provides multi-segment video editing with independent audio inputs
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import {
  CloudUpload,
  Edit,
  Send,
  Star,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VideoUpload from '../components/VideoEditor/VideoUpload';
import ProVideoEditor from '../components/VideoEditor/Pro/ProVideoEditor';

const steps = ['Upload Video', 'Add Segments', 'Process with AI'];

// Custom styled stepper connector (same as basic editor but with Pro colors)
const ProConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
  },
}));

// Custom step icons with Pro theme
const ProStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: ownerState.active ?
    'transparent' :
    ownerState.completed ? 'transparent' : '#e2e8f0',
  background: ownerState.active ?
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
    ownerState.completed ?
    'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
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

function ProStepIcon(props: any) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <CloudUpload />,
    2: <Edit />,
    3: <Send />,
  };

  return (
    <ProStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ProStepIconRoot>
  );
}

const ProVideoEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user has Pro access
  // subscription_tier is a string directly from the API (e.g., "pro", "free", "enterprise")
  const userTierName = (user as any)?.subscription_tier || 'free';
  const hasProAccess = userTierName === 'pro' || userTierName === 'enterprise';

  const handleVideoUpload = useCallback((file: File, url: string) => {
    setVideoFile(file);
    setVideoUrl(url);
    setActiveStep(1);
    setError(null);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Show upgrade message if user doesn't have Pro access
  if (!hasProAccess) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Container maxWidth="md">
          <Card sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <Star sx={{ fontSize: 80, color: '#f59e0b', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1f2937' }}>
              Pro Video Editor
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: '#6b7280' }}>
              Unlock advanced segment-based lip-sync editing
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>
                Pro features include:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                <Typography>✅ Up to 5 custom segments (10 for Enterprise)</Typography>
                <Typography>✅ Multiple audio inputs</Typography>
                <Typography>✅ Timeline-based editing</Typography>
                <Typography>✅ Audio cropping & looping</Typography>
                <Typography>✅ Priority processing queue</Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Your current plan: <strong>{userTierName}</strong>. Upgrade to Pro or Enterprise to access this feature.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/settings')}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Upgrade Now
              </button>
            </Box>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      width: '100%'
    }}>
      {activeStep === 0 && (
        <>
          {/* Hero Section with Pro Badge */}
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(217,119,6,0.9) 100%)',
            pt: 8, pb: 6, color: 'white'
          }}>
            <Container maxWidth="lg">
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Typography variant="h2" sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    mr: 2,
                  }}>
                    Pro Video Editor
                  </Typography>
                  <Chip
                    icon={<Star />}
                    label="PRO"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 40,
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  fontWeight: 300
                }}>
                  Advanced segment-based lip-sync with multiple audio inputs and timeline control
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
                  connector={<ProConnector />}
                  sx={{ mb: 2 }}
                >
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel
                        StepIconComponent={ProStepIcon}
                        sx={{
                          '& .MuiStepLabel-label': {
                            fontWeight: 600,
                            color: index === activeStep ? '#f59e0b' : '#718096',
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
