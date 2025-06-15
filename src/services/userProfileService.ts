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

    // Ambil branch assignment dengan query yang lebih explicit
    let branchId: string | undefined;

    if (profile.role === 'kasir_cabang') {
      console.log('🏪 Fetching branch assignment for kasir_cabang...');
      // Gunakan foreign key hinting di select agar tidak ambigu
      const { data: userBranch, error: branchError } = await supabase
        .from('user_branches')
        .select(`
          branch_id,
          branches!branch_id (
            id,
            name
          )
        `)
        .eq('user_id', supabaseUser.id)
        .single(); // Tetap gunakan single untuk memastikan assignment hanya satu

      if (branchError) {
        console.error('❌ Branch assignment fetch error:', branchError);
        // Tetap allow login, hanya tampilkan warning
        console.warn('⚠️ Kasir cabang belum dikaitkan dengan cabang manapun');
      } else if (userBranch && userBranch.branch_id) {
        branchId = userBranch.branch_id;
        // Pastikan akses ke nama cabang tidak error meski join gagal
        const branchName = userBranch.branches?.name || 'Unknown';
        console.log('✅ Branch assignment found (explicit):', {
          branchId,
          branchName
        });
      } else {
        branchId = undefined; // Pastikan fallback ke undefined
        console.warn('⚠️ No branch assignment found for kasir_cabang');
      }
    } else {
      console.log('✅ Role does not require branch assignment:', profile.role);
    }

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
      hasBranchAssignment: !!branchId
    });
    
    return userProfile;
    
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
};
