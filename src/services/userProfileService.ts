
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { RoleType, User } from '@/contexts/AuthContext';

export const fetchUserBranch = async (userId: string): Promise<string | null> => {
  try {
    console.log('Fetching user branch for user:', userId);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const { data: userBranch, error } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user branch:', error);
      return null;
    }

    console.log('User branch found:', userBranch?.branch_id);
    return userBranch?.branch_id || null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('User branch fetch timeout');
    } else {
      console.error('Error in fetchUserBranch:', error);
    }
    return null;
  }
};

export const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('=== Starting fetchUserProfile ===');
    console.log('User ID:', supabaseUser.id, 'Email:', supabaseUser.email);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Profile fetch timeout - aborting request');
      controller.abort();
    }, 8000); // 8 second timeout

    console.log('Querying profiles table...');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    console.log('Profile query completed. Data:', profile, 'Error:', error);

    if (error) {
      console.error('Database error fetching profile:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    if (!profile) {
      console.error('No profile found for user:', supabaseUser.email, 'ID:', supabaseUser.id);
      throw new Error(`Profile tidak ditemukan untuk user ${supabaseUser.email}. Silakan hubungi administrator.`);
    }

    console.log('Profile found successfully:', profile);

    let branchId: string | undefined;
    
    // For kasir_cabang, fetch their branch assignment
    if (profile.role === 'kasir_cabang') {
      console.log('Fetching branch for kasir...');
      branchId = await fetchUserBranch(supabaseUser.id) || undefined;
      console.log('Branch ID for kasir:', branchId);
    }

    const user: User = {
      id: supabaseUser.id,
      name: profile.name,
      email: supabaseUser.email || '',
      role: profile.role as RoleType,
      branchId
    };

    console.log('=== fetchUserProfile completed successfully ===');
    console.log('Final user object:', user);
    return user;
  } catch (error: any) {
    console.error('=== fetchUserProfile failed ===');
    console.error('Error details:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: Gagal memuat profil pengguna. Silakan coba login ulang.');
    }
    
    // Don't create fallback user - let the error bubble up for proper handling
    throw error;
  }
};
