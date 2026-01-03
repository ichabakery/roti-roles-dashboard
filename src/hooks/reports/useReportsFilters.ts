
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { DateRange, Branch } from '@/types/reports';

export const useReportsFilters = (branches: Branch[], userActualBranchId: string | null) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Generate valid default date range
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    console.log('🗓️ Default date range initialized:', { startDate, endDate });
    
    return {
      start: startDate,
      end: endDate
    };
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();

  // Auto-set branch for kasir using actual branch ID
  useEffect(() => {
    if (user?.role === 'kasir_cabang' && userActualBranchId && branches.length > 0) {
      console.log('🏪 Auto-selecting actual branch for kasir_cabang:', userActualBranchId);
      setSelectedBranch(userActualBranchId);
    } else if ((user?.role === 'owner' || user?.role === 'admin_pusat' || user?.role === 'kepala_produksi') && branches.length > 0) {
      if (selectedBranch === 'all' || !branches.find(b => b.id === selectedBranch)) {
        console.log('🌐 Setting default to all branches for role:', user?.role);
        setSelectedBranch('all');
      }
    }
  }, [user, userActualBranchId, branches, selectedBranch]);

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    const newDateRange = { 
      start: startDate.toISOString().split('T')[0], 
      end: today.toISOString().split('T')[0] 
    };
    
    console.log('📅 Quick date range set:', newDateRange);
    setDateRange(newDateRange);
  };

  const setTodayDateRange = () => {
    const today = new Date().toISOString().split('T')[0];
    const newDateRange = { start: today, end: today };
    console.log('📅 Today date range set:', newDateRange);
    setDateRange(newDateRange);
  };

  const getAvailableBranches = () => {
    const safeBranches = Array.isArray(branches) ? branches : [];
    
    if (user?.role === 'kasir_cabang') {
      const userBranch = safeBranches.filter(branch => branch.id === userActualBranchId);
      console.log('📍 Available branches for kasir_cabang:', userBranch);
      return userBranch;
    }
    console.log('🌍 Available branches for', user?.role, ':', safeBranches.length, 'branches');
    return safeBranches;
  };

  const isBranchSelectionDisabled = user?.role === 'kasir_cabang';

  return {
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
  };
};
