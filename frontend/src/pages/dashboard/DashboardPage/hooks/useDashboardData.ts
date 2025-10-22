/**
 * Dashboard data hook - Manages dashboard stats and jobs data
 */

import { useQuery } from '@tanstack/react-query';
import { jobsApi, usersApi } from '../../../../services/api';

export interface DashboardStats {
  total_jobs?: number;
  pending_jobs?: number;
  success_rate?: number;
  credits_used_this_month?: number;
  monthly_credit_limit?: number;
}

export interface JobData {
  id: string;
  status: string;
  display_name?: string;
  original_filename: string;
  created_at: string;
  progress?: number;
  output_url?: string;
}

export function useDashboardData() {
  // Get user stats
  const {
    data: stats,
    error: statsError
  } = useQuery<DashboardStats>({
    queryKey: ['user-stats'],
    queryFn: usersApi.getUserStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
    enabled: true,
  });

  // Get recent jobs
  const {
    data: recentJobs = [],
    refetch: refetchJobs,
    error: jobsError
  } = useQuery<JobData[]>({
    queryKey: ['recent-jobs'],
    queryFn: () => jobsApi.getUserJobs({ limit: 5 }),
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: false,
    enabled: true,
  });

  const hasError = Boolean(statsError || jobsError);

  return {
    stats,
    recentJobs,
    refetchJobs,
    statsError,
    jobsError,
    hasError,
  };
}
