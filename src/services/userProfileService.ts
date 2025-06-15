
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

    // Get branch assignment - only required for certain roles
    let branchId: string | undefined;
    
    // Define roles that require branch assignment
    const rolesThatNeedBranch = ['kasir_cabang'];
    const rolesThatCanHaveBranch = ['kasir_cabang', 'admin_pusat']; // admin_pusat might have branch assignment for specific operations
    
    if (rolesThatCanHaveBranch.includes(profile.role)) {
      console.log('🏪 Fetching branch assignment for role that can have branch:', profile.role);
      
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
        
        // Only throw error for roles that absolutely need branch assignment
        if (rolesThatNeedBranch.includes(profile.role)) {
          console.error('❌ Required branch assignment missing for:', profile.role);
          throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
        } else {
          console.warn('⚠️ Branch assignment fetch failed, but not required for role:', profile.role);
        }
      } else if (userBranch) {
        branchId = userBranch.branch_id;
        console.log('✅ Branch assignment found:', {
          branchId,
          branchName: userBranch.branches?.name || 'Unknown'
        });
      } else {
        // No branch assignment found
        if (rolesThatNeedBranch.includes(profile.role)) {
          console.error('❌ No branch assignment found for role that requires it:', profile.role);
          throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
        } else {
          console.log('✅ No branch assignment found, but not required for role:', profile.role);
        }
      }
    } else {
      console.log('✅ Role does not require branch assignment:', profile.role);
    }

    // Debug: List all available branches for comparison
    const { data: allBranches } = await supabase
      .from('branches')
      .select('id, name')
      .order('name');
    
    console.log('🏪 Available branches in system:', allBranches);

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
      branchId: userProfile.branchId,
      branchRequired: rolesThatNeedBranch.includes(profile.role)
    });
    
    return userProfile;
    
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};
