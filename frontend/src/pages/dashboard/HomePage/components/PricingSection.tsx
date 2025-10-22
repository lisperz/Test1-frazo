/**
 * Pricing Section - Display pricing plans
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { pricingPlans } from '../data/homeData';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h2"
        textAlign="center"
        gutterBottom
        sx={{ mb: 6, fontWeight: 600 }}
      >
        Choose Your Plan
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {pricingPlans.map((plan, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={plan.popular ? 8 : 2}
              sx={{
                p: 4,
                textAlign: 'center',
                position: 'relative',
                height: '100%',
                border: plan.popular ? '2px solid' : 'none',
                borderColor: plan.popular ? 'primary.main' : 'transparent',
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 3,
                    py: 0.5,
                    borderRadius: 20,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Most Popular
                </Box>
              )}
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {plan.name}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h3"
                  component="span"
                  fontWeight={700}
                  color="primary.main"
                >
                  {plan.price}
                </Typography>
                <Typography variant="body1" component="span" color="text.secondary">
                  {plan.period}
                </Typography>
              </Box>
              <Typography variant="subtitle1" color="primary.main" gutterBottom>
                {plan.credits}
              </Typography>
              <List sx={{ mb: 3 }}>
                {plan.features.map((feature, featureIndex) => (
                  <ListItem key={featureIndex} sx={{ py: 0.5, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Check color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant={plan.popular ? 'contained' : 'outlined'}
                fullWidth
                size="large"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PricingSection;
