
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { DateRange, Branch } from '@/types/reports';

export const useReportsFilters = (branches: Branch[]) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const { user } = useAuth();

  useEffect(() => {
    // For kasir role, auto-select their branch
    if (user?.role === 'kasir_cabang' && user.branchId && branches.length > 0) {
      setSelectedBranch(user.branchId);
    }
  }, [user, branches]);

  return {
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange
  };
};
