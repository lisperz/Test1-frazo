import React from 'react';
import { Container, Alert } from '@mui/material';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useJobs } from './hooks/useJobs';
import JobsHeader from './components/JobsHeader';
import SearchAndFilters from './components/SearchAndFilters';
import EmptyState from './components/EmptyState';
import JobsTable from './components/JobsTable';
import JobActionsMenu from './components/JobActionsMenu';

const JobsPage: React.FC = () => {
  const { isConnected } = useWebSocket();
  const {
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
  } = useJobs();

  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const hasFilters = searchTerm !== '' || statusFilter !== 'all';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <JobsHeader onRefresh={refetch} />

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are currently {isConnected ? 'connected' : 'disconnected'}. Job statuses may not reflect
          the latest changes.
        </Alert>
      )}

      <SearchAndFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        totalJobs={totalJobs}
        currentJobsCount={jobs.length}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
      />

      {jobs.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <JobsTable
          jobs={jobs}
          totalJobs={totalJobs}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onMenuOpen={handleMenuOpen}
        />
      )}

      <JobActionsMenu
        anchorEl={anchorEl}
        selectedJob={selectedJob}
        onClose={handleCloseMenu}
        onCancelJob={cancelJobMutation.mutate}
        onDeleteJob={deleteJobMutation.mutate}
        isCancelling={cancelJobMutation.isPending}
        isDeleting={deleteJobMutation.isPending}
      />
    </Container>
  );
};

export default JobsPage;
