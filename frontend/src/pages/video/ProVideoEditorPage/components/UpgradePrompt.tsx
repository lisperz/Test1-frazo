/**
 * Upgrade Prompt - Display upgrade message for non-Pro users
 */

import React from 'react';
import { Box, Container, Card, Typography, Alert } from '@mui/material';
import { Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  userTierName: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ userTierName }) => {
  const navigate = useNavigate();

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
};

export default UpgradePrompt;
