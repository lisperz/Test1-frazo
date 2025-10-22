/**
 * Pro Stepper - Progress stepper for Pro Video Editor
 */

import React from 'react';
import { Card, Box, Typography, Stepper, Step, StepLabel } from '@mui/material';
import ProConnector from './ProConnector';
import ProStepIcon from './ProStepIcon';

interface ProStepperProps {
  activeStep: number;
  steps: string[];
}

const ProStepper: React.FC<ProStepperProps> = ({ activeStep, steps }) => {
  return (
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
  );
};

export default ProStepper;
