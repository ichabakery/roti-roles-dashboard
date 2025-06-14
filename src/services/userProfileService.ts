
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
    console.log('Fetching profile for user:', supabaseUser.id, 'email:', supabaseUser.email);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
    });
    
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

    if (error) {
      console.error('Error fetching profile:', error);
      // Return basic user instead of null to prevent blocking
      return createBasicUser(supabaseUser);
    }

    if (!profile) {
      console.log('No profile found for user:', supabaseUser.email);
      return createBasicUser(supabaseUser);
    }

    console.log('Profile found:', profile);

    let branchId: string | undefined;
    
    // For kasir_cabang, fetch their branch assignment
    if (profile.role === 'kasir_cabang') {
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

    console.log('Created user object from profile:', user);
    return user;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    // Return basic user instead of null to prevent blocking
    return createBasicUser(supabaseUser);
  }
};

const createBasicUser = (supabaseUser: SupabaseUser): User => {
  console.log('Creating basic user for:', supabaseUser.email);
  return {
    id: supabaseUser.id,
    name: supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    role: 'kasir_cabang'
  };
};
