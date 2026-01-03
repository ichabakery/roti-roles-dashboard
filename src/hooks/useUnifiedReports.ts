
import React, { useState, useEffect, useMemo } from 'react';
import { useReportsData } from '@/hooks/reports/useReportsDataSimple';
import { useReportsFilters } from '@/hooks/reports/useReportsFilters';
import { useReportsSummaries } from '@/hooks/reports/useReportsSummaries';
import { useAuth } from '@/contexts/AuthContext';

export const useUnifiedReports = () => {
  const { user } = useAuth();
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  
  // Initialize filters first with default date range
  const {
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    sourceTypeFilter,
    setSourceTypeFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    setQuickDateRange,
    setTodayDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled
  } = useReportsFilters(branches, userActualBranchId);

  // Fetch user branch and branches data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch branches first
        const { fetchBranchesFromDB } = await import('@/services/reportsService');
        const branchData = await fetchBranchesFromDB();
        setBranches(Array.isArray(branchData) ? branchData : []);
        
        // Fetch user branch for kasir_cabang
        if (user?.role === 'kasir_cabang' && user.id) {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: userBranch } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userBranch?.branch_id) {
            setUserActualBranchId(userBranch.branch_id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setBranchesLoading(false);
      }
    };

    if (user) {
      fetchInitialData();
    }
  }, [user]);

  // Fetch transaction data only when we have valid filters
  const {
    transactions: rawTransactions,
    loading: dataLoading
  } = useReportsData(selectedBranch, dateRange, paymentStatusFilter);

  // Filter transactions by source type
  const transactions = React.useMemo(() => {
    if (!Array.isArray(rawTransactions)) return [];
    if (sourceTypeFilter === 'all') return rawTransactions;
    return rawTransactions.filter(t => t.source_type === sourceTypeFilter);
  }, [rawTransactions, sourceTypeFilter]);

  // Generate summaries from filtered data
  const summaries = useReportsSummaries(transactions, searchQuery);

  return {
    transactions: Array.isArray(transactions) ? transactions : [],
    branches: Array.isArray(branches) ? branches : [],
    loading: branchesLoading || dataLoading,
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    sourceTypeFilter,
    setSourceTypeFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    summaries,
    setQuickDateRange,
    setTodayDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir: user?.role === 'kasir_cabang'
  };
};
