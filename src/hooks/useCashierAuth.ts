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
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);

  // Fetch user's actual branch assignment from database
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 Fetching actual branch assignment for kasir_cabang:', user.id);
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('❌ Error fetching user branch:', error);
            setUserActualBranchId(null);
            return;
          }
          
          if (userBranch) {
            console.log('✅ Found user branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ No branch assignment found for kasir_cabang');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      }
    };

    fetchUserBranch();
  }, [user]);

  // Set access permissions based on actual branch assignment
  useEffect(() => {
    if (user?.role === 'kasir_cabang') {
      if (userActualBranchId) {
        console.log('✅ Kasir has branch assignment:', userActualBranchId);
        setSelectedBranch(userActualBranchId);
        setBranchError(null);
        setHasAccess(true);
      } else {
        console.error('❌ Kasir user without branch assignment:', user);
        setBranchError('Akun kasir Anda belum dikaitkan dengan cabang. Silakan hubungi administrator.');
        setHasAccess(false);
      }
      setIsCheckingAccess(false);
    } else if (user?.role) {
      // Other roles have access by default
      setHasAccess(true);
      setIsCheckingAccess(false);
    }
  }, [user, userActualBranchId]);

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
            branches!fk_user_branches_branch_id (
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
