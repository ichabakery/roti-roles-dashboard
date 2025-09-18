
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
          console.log('🔍 [KASIR] Fetching actual branch assignment for kasir_cabang:', user.id, user.email);
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error && error.code !== 'PGRST116') {
            console.error('❌ [KASIR] Error fetching user branch:', error);
            setUserActualBranchId(null);
            return;
          }
          
          if (userBranch) {
            console.log('✅ [KASIR] Found user branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ [KASIR] No branch assignment found for kasir_cabang');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ [KASIR] Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      } else {
        // For non-kasir_cabang roles, clear branch data
        setUserActualBranchId(null);
      }
    };

    fetchUserBranch();
  }, [user]);

  // Set access permissions based on actual branch assignment
  useEffect(() => {
    if (user?.role === 'kasir_cabang') {
      if (userActualBranchId) {
        console.log('✅ [KASIR] Kasir has branch assignment:', userActualBranchId);
        setSelectedBranch(userActualBranchId);
        setBranchError(null);
        setHasAccess(true);
      } else {
        console.error('❌ [KASIR] Kasir user without branch assignment:', user.email);
        setBranchError('Akun kasir Anda belum dikaitkan dengan cabang. Silakan hubungi administrator.');
        setHasAccess(false);
      }
      setIsCheckingAccess(false);
    } else if (user?.role && ['owner', 'admin_pusat'].includes(user.role)) {
      // Owner and admin_pusat have full access without branch restrictions
      console.log('✅ [KASIR] Non-kasir user has full access:', user.role);
      setHasAccess(true);
      setIsCheckingAccess(false);
      setBranchError(null);
    } else if (user?.role) {
      // Other roles don't have kasir access
      console.log('❌ [KASIR] Role not allowed for kasir:', user.role);
      setBranchError('Role Anda tidak memiliki akses ke fitur kasir.');
      setHasAccess(false);
      setIsCheckingAccess(false);
    }
  }, [user, userActualBranchId]);

  useEffect(() => {
    if (user && ['owner', 'admin_pusat', 'kasir_cabang'].includes(user.role)) {
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
      console.log('🔍 [KASIR] Fetching branches for current user...');
      
      if (!user?.id) {
        console.log('⚠️ [KASIR] No user ID available');
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
          console.error('❌ [KASIR] Error fetching user branches:', error);
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
        
        console.log('✅ [KASIR] Kasir branches:', branchData);
        setBranches(branchData);
        
        if (branchData.length > 0 && !selectedBranch) {
          setSelectedBranch(branchData[0].id);
          setHasAccess(true);
        } else if (branchData.length === 0) {
          setBranchError('Akun Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator.');
          setHasAccess(false);
        }
      } else if (['owner', 'admin_pusat'].includes(user.role)) {
        // For owner and admin_pusat, get all branches
        const { data, error } = await supabase
          .from('branches')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('❌ [KASIR] Error fetching all branches:', error);
          setBranchError('Gagal memuat data cabang');
          return;
        }

        setBranches(data || []);
        
        if (data && data.length > 0 && !selectedBranch) {
          setSelectedBranch(data[0].id);
        }
      } else {
        // Other roles don't have access to kasir
        console.log('⚠️ [KASIR] Role not allowed:', user.role);
        setBranches([]);
      }
    } catch (error: any) {
      console.error('❌ [KASIR] Error fetching branches:', error);
      setBranchError(`Gagal memuat data cabang: ${error.message}`);
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
