
import { useReportsData } from '@/hooks/reports/useReportsData';
import { useReportsFilters } from '@/hooks/reports/useReportsFilters';
import { useReportsSummaries } from '@/hooks/reports/useReportsSummaries';
import { useAuth } from '@/contexts/AuthContext';

export const useUnifiedReports = () => {
  const { user } = useAuth();
  
  // Fetch data first to get branches and userActualBranchId
  const {
    transactions,
    branches,
    loading,
    userActualBranchId
  } = useReportsData('all', { start: '', end: '' }, 'all'); // Initial values

  // Initialize filters with actual data
  const {
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled
  } = useReportsFilters(branches, userActualBranchId);

  // Fetch data with actual filters
  const {
    transactions: filteredTransactions,
    loading: dataLoading
  } = useReportsData(selectedBranch, dateRange, paymentStatusFilter);

  // Generate summaries from filtered data
  const summaries = useReportsSummaries(filteredTransactions, searchQuery);

  return {
    transactions: Array.isArray(filteredTransactions) ? filteredTransactions : [],
    branches: Array.isArray(branches) ? branches : [],
    loading: loading || dataLoading,
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    summaries,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir: user?.role === 'kasir_cabang'
  };
};
