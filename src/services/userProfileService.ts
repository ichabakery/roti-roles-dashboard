
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/contexts/AuthContext';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('🔍 Fetching profile for user:', supabaseUser.email, 'ID:', supabaseUser.id);
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('Profile data is null');
    }

    console.log('✅ Profile fetched:', {
      id: profile.id,
      name: profile.name,
      role: profile.role
    });

    // Get branch assignment for all roles (not just kasir_cabang)
    let branchId: string | undefined;
    
    console.log('🏪 Fetching branch assignment for user...');
    
    const { data: userBranch, error: branchError } = await supabase
      .from('user_branches')
      .select(`
        branch_id,
        branches!branch_id(id, name)
      `)
      .eq('user_id', supabaseUser.id)
      .maybeSingle();

    if (branchError) {
      console.error('❌ Branch assignment fetch error:', branchError);
      if (profile.role === 'kasir_cabang') {
        console.warn('⚠️ Kasir cabang without branch assignment - this will cause issues');
      }
    } else if (userBranch) {
      branchId = userBranch.branch_id;
      console.log('✅ Branch assignment found:', {
        branchId,
        branchName: userBranch.branches?.name || 'Unknown'
      });
    } else {
      console.warn('⚠️ No branch assignment found for user:', {
        userId: supabaseUser.id,
        role: profile.role,
        requiresBranch: profile.role === 'kasir_cabang'
      });
    }

    // Debug: List all available branches for comparison
    const { data: allBranches } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');
    
    console.log('🏪 Available branches in system:', allBranches);

    // Debug: Check for any transactions in the system
    const { data: sampleTransactions, count } = await supabase
      .from('transactions')
      .select('id, branch_id, transaction_date', { count: 'exact' })
      .limit(5);
    
    console.log('💾 Sample transactions in system:', {
      totalCount: count,
      sampleData: sampleTransactions
    });

    const userProfile: User = {
      id: profile.id,
      name: profile.name,
      email: supabaseUser.email || '',
      role: profile.role as any,
      branchId
    };

    console.log('✅ Final user profile constructed:', {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      branchId: userProfile.branchId
    });
    
    return userProfile;
    
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};
