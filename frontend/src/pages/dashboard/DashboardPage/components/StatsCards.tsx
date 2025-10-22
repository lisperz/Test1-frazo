/**
 * Stats Cards - Dashboard statistics display
 */

import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import {
  VideoLibrary,
  AccountBalanceWallet,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { DashboardStats } from '../hooks/useDashboardData';

interface StatsCardsProps {
  stats?: DashboardStats;
  creditsBalance: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, creditsBalance }) => {
  const dashboardCards = [
    {
      title: 'Total Videos Processed',
      value: stats?.total_jobs || 0,
      icon: <VideoLibrary color="primary" />,
      color: 'primary.main',
    },
    {
      title: 'Credits Remaining',
      value: creditsBalance,
      icon: <AccountBalanceWallet color="success" />,
      color: 'success.main',
    },
    {
      title: 'Processing Queue',
      value: stats?.pending_jobs || 0,
      icon: <Schedule color="warning" />,
      color: 'warning.main',
    },
    {
      title: 'Success Rate',
      value: `${stats?.success_rate || 0}%`,
      icon: <TrendingUp color="info" />,
      color: 'info.main',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {dashboardCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="subtitle2">
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color={card.color}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{ fontSize: 40 }}>
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
