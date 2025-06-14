
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { RoleType, User } from '@/contexts/AuthContext';

export const fetchUserBranch = async (userId: string): Promise<string | null> => {
  try {
    console.log('Fetching user branch for user:', userId);
    
    const { data: userBranch, error } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user branch:', error);
      return null;
    }

    console.log('User branch found:', userBranch?.branch_id);
    return userBranch?.branch_id || null;
  } catch (error) {
    console.error('Error in fetchUserBranch:', error);
    return null;
  }
};

export const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('Fetching profile for user:', supabaseUser.id);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      // If no profile found, create a basic one
      const basicUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        role: 'kasir_cabang'
      };
      console.log('Created basic user object:', basicUser);
      return basicUser;
    }

    if (!profile) {
      console.log('No profile found, creating basic user');
      const basicUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        role: 'kasir_cabang'
      };
      return basicUser;
    }

    let branchId: string | undefined;
    
    // For kasir_cabang, fetch their branch assignment
    if (profile.role === 'kasir_cabang') {
      branchId = await fetchUserBranch(supabaseUser.id) || undefined;
    }

    const user: User = {
      id: supabaseUser.id,
      name: profile.name,
      email: supabaseUser.email || '',
      role: profile.role as RoleType,
      branchId
    };

    console.log('Created user object from profile:', user);
    return user;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    // Return basic user instead of null to prevent blocking
    const basicUser: User = {
      id: supabaseUser.id,
      name: supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: 'kasir_cabang'
    };
    return basicUser;
  }
};
