
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange, Branch } from '@/types/reports';

export const useReportsFilters = (branches: Branch[]) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          const { data: userBranch } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .single();
          
          if (userBranch) {
            setUserActualBranchId(userBranch.branch_id);
          }
        } catch (error) {
          console.error('Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      }
    };

    fetchUserBranch();
  }, [user]);

  useEffect(() => {
    console.log('🔧 Setting up filters for user:', {
      role: user?.role,
      branchId: user?.branchId,
      actualBranchId: userActualBranchId,
      availableBranches: branches.length
    });

    // For kasir_cabang role, auto-select their actual branch and lock it
    if (user?.role === 'kasir_cabang' && userActualBranchId && branches.length > 0) {
      console.log('🏪 Auto-selecting actual branch for kasir_cabang:', userActualBranchId);
      setSelectedBranch(userActualBranchId);
    } else if ((user?.role === 'owner' || user?.role === 'admin_pusat' || user?.role === 'kepala_produksi') && branches.length > 0) {
      // For other roles, default to 'all' unless already set to a valid branch
      if (selectedBranch === 'all' || !branches.find(b => b.id === selectedBranch)) {
        console.log('🌐 Setting default to all branches for role:', user?.role);
        setSelectedBranch('all');
      }
    }
  }, [user, branches, userActualBranchId]);

  // Function to check if branch selection should be disabled
  const isBranchSelectionDisabled = () => {
    return user?.role === 'kasir_cabang';
  };

  // Function to get available branches for selection
  const getAvailableBranches = () => {
    if (user?.role === 'kasir_cabang') {
      // Kasir only sees their assigned branch
      const userBranch = branches.filter(branch => branch.id === userActualBranchId);
      console.log('📍 Available branches for kasir_cabang:', userBranch);
      return userBranch;
    }
    // Other roles see all branches
    console.log('🌍 Available branches for', user?.role, ':', branches.length, 'branches');
    return branches;
  };

  return {
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    isBranchSelectionDisabled,
    getAvailableBranches
  };
};
