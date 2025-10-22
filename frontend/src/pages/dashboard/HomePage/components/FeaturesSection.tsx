/**
 * Features Section - Showcase platform features
 */

import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { features } from '../data/homeData';

const FeaturesSection: React.FC = () => {
  return (
    <Box sx={{ py: 8 }}>
      <Typography
        variant="h3"
        component="h2"
        textAlign="center"
        gutterBottom
        sx={{ mb: 6, fontWeight: 600 }}
      >
        Why Choose Our Service?
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2, fontSize: 40 }}>
                      <IconComponent color="primary" />
                    </Box>
                    <Typography variant="h6" component="h3" fontWeight={600}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default FeaturesSection;
