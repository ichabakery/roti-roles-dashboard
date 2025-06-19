
import { useReportsData } from '@/hooks/reports/useReportsData';
import { useReportsFilters } from '@/hooks/reports/useReportsFilters';
import { useReportsSummaries } from '@/hooks/reports/useReportsSummaries';
import { useAuth } from '@/contexts/AuthContext';

export const useUnifiedReports = () => {
  const { user } = useAuth();
  
  // Initialize filters first
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
  } = useReportsFilters([], null); // Will be updated when branches are loaded

  // Fetch data based on filters
  const {
    transactions,
    branches,
    loading,
    userActualBranchId
  } = useReportsData(selectedBranch, dateRange, paymentStatusFilter);

  // Update filters with actual data
  const filtersWithData = useReportsFilters(branches, userActualBranchId);

  // Generate summaries
  const summaries = useReportsSummaries(transactions, searchQuery);

  return {
    transactions: Array.isArray(transactions) ? transactions : [],
    branches: Array.isArray(branches) ? branches : [],
    loading,
    selectedBranch: filtersWithData.selectedBranch,
    setSelectedBranch: filtersWithData.setSelectedBranch,
    paymentStatusFilter: filtersWithData.paymentStatusFilter,
    setPaymentStatusFilter: filtersWithData.setPaymentStatusFilter,
    dateRange: filtersWithData.dateRange,
    setDateRange: filtersWithData.setDateRange,
    searchQuery: filtersWithData.searchQuery,
    setSearchQuery: filtersWithData.setSearchQuery,
    summaries,
    setQuickDateRange: filtersWithData.setQuickDateRange,
    getAvailableBranches: filtersWithData.getAvailableBranches,
    isBranchSelectionDisabled: filtersWithData.isBranchSelectionDisabled,
    isKasir: user?.role === 'kasir_cabang'
  };
};
