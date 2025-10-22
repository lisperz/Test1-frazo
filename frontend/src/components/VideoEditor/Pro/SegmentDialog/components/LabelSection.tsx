import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

interface LabelSectionProps {
  label: string;
  onLabelChange: (label: string) => void;
}

const LabelSection: React.FC<LabelSectionProps> = ({ label, onLabelChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        📝 Label (Optional)
      </Typography>
      <TextField
        label="Segment Label"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="e.g., Interview Section"
        size="small"
        fullWidth
      />
      <Typography variant="caption" color="text.secondary">
        Add a label to identify this segment
      </Typography>
    </Box>
  );
};

export default LabelSection;
