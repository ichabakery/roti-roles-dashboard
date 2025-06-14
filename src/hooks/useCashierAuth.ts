
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  name: string;
}

export const useCashierAuth = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (user?.role === 'kasir_cabang' && user.branchId) {
      console.log('Setting branch for kasir:', user.branchId);
      setSelectedBranch(user.branchId);
      setBranchError(null);
      setHasAccess(true);
      setIsCheckingAccess(false);
    } else if (user?.role === 'kasir_cabang' && !user.branchId) {
      console.error('Kasir user without branch assignment:', user);
      setBranchError('Akun kasir Anda belum dikaitkan dengan cabang. Silakan hubungi administrator.');
      setHasAccess(false);
      setIsCheckingAccess(false);
    } else {
      setHasAccess(true);
      setIsCheckingAccess(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBranches();
    }
  }, [user]);

  const verifyBranchAccess = async (branchId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', user.id)
        .eq('branch_id', branchId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error verifying branch access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error verifying branch access:', error);
      return false;
    }
  };

  const fetchBranches = async () => {
    try {
      console.log('Fetching branches for current user...');
      
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      // For kasir_cabang, get only their assigned branches
      if (user.role === 'kasir_cabang') {
        const { data: userBranches, error } = await supabase
          .from('user_branches')
          .select(`
            branch_id,
            branches:fk_user_branches_branch_id (
              id,
              name,
              address,
              phone
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user branches:', error);
          setBranchError('Gagal memuat data cabang yang dikaitkan dengan akun Anda');
          setHasAccess(false);
          return;
        }

        const branchData = (userBranches || [])
          .map(ub => ub.branches)
          .filter(branch => branch)
          .map(branch => ({
            id: branch!.id,
            name: branch!.name
          }));
        
        console.log('Kasir branches:', branchData);
        setBranches(branchData);
        
        if (branchData.length > 0 && !selectedBranch) {
          setSelectedBranch(branchData[0].id);
          setHasAccess(true);
        } else if (branchData.length === 0) {
          setBranchError('Akun Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator.');
          setHasAccess(false);
        }
      } else {
        // For owner and admin_pusat, get all branches
        const { data, error } = await supabase
          .from('branches')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching all branches:', error);
          setBranchError('Gagal memuat data cabang');
          setHasAccess(false);
          return;
        }

        setBranches(data || []);
        
        if (data && data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].id);
          setHasAccess(true);
        }
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setBranchError(`Gagal memuat data cabang: ${error.message}`);
      setHasAccess(false);
    }
  };

  return {
    user,
    branches,
    selectedBranch,
    setSelectedBranch,
    branchError,
    hasAccess,
    isCheckingAccess,
    verifyBranchAccess
  };
};
