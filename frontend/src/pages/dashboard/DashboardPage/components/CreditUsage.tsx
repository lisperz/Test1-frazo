/**
 * Credit Usage - Monthly credit usage tracker
 */

import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { DashboardStats } from '../hooks/useDashboardData';

interface CreditUsageProps {
  stats?: DashboardStats;
}

const CreditUsage: React.FC<CreditUsageProps> = ({ stats }) => {
  const creditsUsed = stats?.credits_used_this_month || 0;
  const creditLimit = stats?.monthly_credit_limit || 1000;
  const usagePercentage = Math.min((creditsUsed / creditLimit) * 100, 100);
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Credit Usage This Month
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Used: {creditsUsed}
            </Typography>
            <Typography variant="body2">
              Limit: {stats?.monthly_credit_limit || 'Unlimited'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={usagePercentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {stats?.monthly_credit_limit && stats?.credits_used_this_month
            ? `${creditsRemaining} credits remaining this month`
            : 'Unlimited usage available'
          }
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CreditUsage;
