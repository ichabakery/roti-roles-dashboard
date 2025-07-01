
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { DateRange, Branch } from '@/types/reports';

export const useReportsFilters = (branches: Branch[], userActualBranchId: string | null) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Pastikan tanggal default selalu valid
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
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
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setDateRange({ 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    });
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
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled
  };
};
