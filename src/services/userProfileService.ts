
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/contexts/AuthContext';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('Fetching profile for user:', supabaseUser.email);
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', supabaseUser.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error('Profile data is null');
    }

    console.log('Profile fetched:', profile);

    // Get branch assignment for kasir_cabang role
    let branchId: string | undefined;
    
    if (profile.role === 'kasir_cabang') {
      console.log('Fetching branch assignment for kasir_cabang...');
      
      const { data: userBranch, error: branchError } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', supabaseUser.id)
        .maybeSingle();

      if (branchError) {
        console.error('Branch assignment fetch error:', branchError);
        // Don't throw error here, just log it
        console.warn('Kasir cabang without branch assignment');
      } else if (userBranch) {
        branchId = userBranch.branch_id;
        console.log('Branch assignment found:', branchId);
      } else {
        console.warn('No branch assignment found for kasir_cabang');
      }
    }

    const userProfile: User = {
      id: profile.id,
      name: profile.name,
      email: supabaseUser.email || '',
      role: profile.role as any,
      branchId
    };

    console.log('Final user profile:', userProfile);
    return userProfile;
    
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};
