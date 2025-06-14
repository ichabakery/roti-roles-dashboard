
import { supabase } from '@/integrations/supabase/client';
import { RoleType } from '@/contexts/AuthContext';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  branchId?: string;
}

export const createUserInSystem = async (userData: CreateUserData) => {
  console.log('Creating user with data:', userData);

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
        role: userData.role,
      },
      emailRedirectTo: `${window.location.origin}/dashboard`
    }
  });

  if (authError) {
    console.error('Auth error:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User creation failed - no user returned');
  }

  console.log('User created in auth:', authData.user.id);

  // 2. Update profile with correct role (trigger should have created basic profile)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      name: userData.name,
      role: userData.role 
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('Profile update error:', profileError);
    // Don't throw here as user is already created
  }

  // 3. If kasir_cabang, assign to branch
  if (userData.role === 'kasir_cabang' && userData.branchId) {
    const { error: branchError } = await supabase
      .from('user_branches')
      .insert({
        user_id: authData.user.id,
        branch_id: userData.branchId
      });

    if (branchError) {
      console.error('Branch assignment error:', branchError);
      // Don't throw here as user is already created
    }
  }

  return { success: true };
};
