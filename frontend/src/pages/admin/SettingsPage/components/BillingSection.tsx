import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { SubscriptionPlan, CreditTransaction } from '../types';

interface BillingSectionProps {
  subscriptionPlans: SubscriptionPlan[];
  creditHistory: CreditTransaction[];
}

export const BillingSection: React.FC<BillingSectionProps> = ({
  subscriptionPlans,
  creditHistory,
}) => {
  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Current Plan
          </Typography>
          <Grid container spacing={2}>
            {subscriptionPlans.map((plan) => (
              <Grid item xs={12} md={4} key={plan.name}>
                <Paper
                  sx={{
                    p: 2,
                    border: plan.current ? 2 : 1,
                    borderColor: plan.current ? 'primary.main' : 'grey.300',
                    position: 'relative',
                  }}
                >
                  {plan.current && (
                    <Chip
                      label="Current"
                      color="primary"
                      size="small"
                      sx={{ position: 'absolute', top: -8, right: 8 }}
                    />
                  )}
                  <Typography variant="h6" gutterBottom>{plan.name}</Typography>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    {plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.credits}
                  </Typography>
                  {!plan.current && (
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                      Upgrade
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Credit History
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {creditHistory.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type}
                        size="small"
                        color={transaction.amount > 0 ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography color={transaction.amount > 0 ? 'success.main' : 'error.main'}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.balance_after}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};
