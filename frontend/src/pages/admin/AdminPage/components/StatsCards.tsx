import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { DashboardStat } from '../types';

interface StatsCardsProps {
  stats: DashboardStat[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color={stat.color}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{ fontSize: 40 }}>
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
