
import { supabase } from '@/integrations/supabase/client';
import { Branch } from '@/types/inventory';

export const fetchBranchesForUser = async (userRole: string, userBranchId?: string | null) => {
  console.log('📍 Fetching branches for user role:', userRole, 'branchId:', userBranchId);
  
  if (userRole === 'kasir_cabang' && userBranchId) {
    // For kasir, only get their assigned branch
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', userBranchId)
      .single();

    if (error) throw error;

    return data ? [data] : [];
  } else {
    // For other roles, get all branches
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');

    if (error) throw error;

    return data || [];
  }
};
