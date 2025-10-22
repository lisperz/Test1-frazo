import React from 'react';

export interface DashboardStat {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  subscription_tier: string;
  credits_balance: number;
  total_jobs?: number;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  user_email: string;
  display_name?: string;
  original_filename: string;
  status: string;
  progress?: number;
  credits_used?: number;
  estimated_credits?: number;
  created_at: string;
}
