
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
  console.log('Creating user via edge function:', userData.email);

  // Call edge function instead of signUp to avoid session change
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      branchId: userData.branchId
    }
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Gagal membuat pengguna');
  }

  if (!data?.success) {
    console.error('User creation failed:', data?.error);
    throw new Error(data?.error || 'Gagal membuat pengguna');
  }

  console.log('User created successfully:', data.userId);
  return { success: true, userId: data.userId };
};
