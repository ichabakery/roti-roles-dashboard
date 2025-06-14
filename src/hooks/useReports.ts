
import { useEffect } from 'react';
import { useReportsData } from '@/hooks/useReportsData';
import { useReportsFilters } from '@/hooks/useReportsFilters';
import { useReportsCalculations } from '@/hooks/useReportsCalculations';

export const useReports = () => {
  const {
    transactions,
    summary,
    productSummary,
    paymentSummary,
    branches,
    loading,
    fetchBranches,
    fetchReportsData
  } = useReportsData();

  const {
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange
  } = useReportsFilters(branches);

  const {
    getTotalRevenue,
    getTotalTransactions,
    getAverageTransaction
  } = useReportsCalculations(summary);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReportsData(selectedBranch, dateRange);
  }, [selectedBranch, dateRange]);

  const handleFetchReportsData = () => {
    fetchReportsData(selectedBranch, dateRange);
  };

  return {
    transactions,
    summary,
    productSummary,
    paymentSummary,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    fetchReportsData: handleFetchReportsData,
    getTotalRevenue,
    getTotalTransactions,
    getAverageTransaction
  };
};
