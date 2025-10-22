/**
 * Pro Connector - Custom stepper connector for Pro Video Editor
 */

import { StepConnector, stepConnectorClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

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

export default ProConnector;
