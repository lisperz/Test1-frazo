import React from 'react';
import { Box, Card, CardContent, Avatar, Typography } from '@mui/material';
import { Speed, Security } from '@mui/icons-material';

const InfoPanel: React.FC = () => {
  const howItWorksSteps = [
    'AI automatically detects text in your video',
    'Advanced inpainting removes text seamlessly',
    'Download your processed video',
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* How It Works */}
      <Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
            p: 2,
            color: 'white',
          }}
        >
          <Avatar
            sx={{
              background: 'rgba(255,255,255,0.2)',
              mb: 1,
              width: 32,
              height: 32,
            }}
          >
            <Speed sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            How It Works
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Professional AI processing in three simple steps
          </Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          {howItWorksSteps.map((step, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: index < 2 ? 1 : 0 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  mr: 1.5,
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </Avatar>
              <Typography variant="caption" sx={{ color: '#2d3748', fontSize: '0.8rem' }}>
                {step}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Credit Usage */}
      <Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            p: 2,
            color: 'white',
          }}
        >
          <Avatar
            sx={{
              background: 'rgba(255,255,255,0.2)',
              mb: 1,
              width: 32,
              height: 32,
            }}
          >
            <Security sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Processing Details
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Transparent pricing and timing information
          </Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748' }}>
            Credit Usage
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Processing costs approximately 10 credits per minute of video.
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#2d3748' }}>
            Processing Time
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Professional AI processing takes 3-10 minutes to ensure quality results.
          </Typography>

          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(250,112,154,0.1) 0%, rgba(254,225,64,0.1) 100%)',
              p: 1.5,
              borderRadius: '8px',
              border: '1px solid rgba(250,112,154,0.2)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#2d3748', fontWeight: 500, fontSize: '0.75rem' }}>
              Example: A 3-minute video costs ~30 credits
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InfoPanel;
