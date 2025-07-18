
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserBranchData {
  branchId?: string;
  branchName?: string;
}

export const useUserBranch = () => {
  const { user } = useAuth();
  const [userBranch, setUserBranch] = useState<UserBranchData>({});
  const [loading, setLoading] = useState(false);

  const fetchUserBranch = async () => {
    if (!user?.id || user.role !== 'kasir_cabang') {
      setUserBranch({});
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching branch data for user:', user.id);

      const { data, error } = await supabase
        .from('user_branches')
        .select(`
          branch_id,
          branches!fk_user_branches_branch_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user branch:', error);
        setUserBranch({});
        return;
      }

      if (data?.branches) {
        setUserBranch({
          branchId: data.branches.id,
          branchName: data.branches.name
        });
        console.log('User branch data:', data.branches);
      } else {
        setUserBranch({});
      }
    } catch (error) {
      console.error('Error in fetchUserBranch:', error);
      setUserBranch({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBranch();
  }, [user?.id, user?.role]);

  return {
    userBranch,
    loading,
    refreshUserBranch: fetchUserBranch
  };
};
