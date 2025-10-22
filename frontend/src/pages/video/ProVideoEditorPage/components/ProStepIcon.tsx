/**
 * Pro Step Icon - Custom step icons for Pro Video Editor
 */

import React from 'react';
import { CloudUpload, Edit, Send } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { StepIconProps } from '@mui/material/StepIcon';

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

function ProStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <CloudUpload />,
    2: <Edit />,
    3: <Send />,
  };

  return (
    <ProStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ProStepIconRoot>
  );
}

export default ProStepIcon;
