import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../../../services/api';
import { JobsQueryParams } from '../types';

export const useJobs = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const queryParams: JobsQueryParams = {
    offset: page * rowsPerPage,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data: jobsData, isLoading, refetch } = useQuery({
    queryKey: ['user-jobs', page, rowsPerPage, searchTerm, statusFilter],
    queryFn: () => jobsApi.getUserJobs(queryParams),
    refetchInterval: 5000,
  });

  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
      handleCloseMenu();
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-jobs'] });
      handleCloseMenu();
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, job: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  return {
    jobsData,
    isLoading,
    refetch,
    page,
    rowsPerPage,
    searchTerm,
    statusFilter,
    anchorEl,
    selectedJob,
    setSearchTerm,
    setStatusFilter,
    handleChangePage,
    handleChangeRowsPerPage,
    handleMenuOpen,
    handleCloseMenu,
    cancelJobMutation,
    deleteJobMutation,
  };
};
