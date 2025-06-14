
import { supabase } from '@/integrations/supabase/client';
import { RoleType } from '@/contexts/AuthContext';
import { ProfileData } from './profilesService';

export interface UpdateUserData {
  name: string;
  role: RoleType;
  branchId?: string;
}

export const updateUserInSystem = async (userId: string, userData: UpdateUserData, profiles: ProfileData[]) => {
  console.log('Attempting to update user:', userId, userData);
  
  // Check if trying to update owner
  const profile = profiles.find(p => p.id === userId);
  if (profile?.role === 'owner') {
    throw new Error('Owner tidak dapat diubah');
  }

  try {
    // First, update the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        role: userData.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error('Gagal memperbarui profil pengguna: ' + profileError.message);
    }

    // Handle branch assignment for kasir_cabang
    if (userData.role === 'kasir_cabang') {
      // First, remove any existing branch assignments
      await supabase
        .from('user_branches')
        .delete()
        .eq('user_id', userId);

      // If branchId is provided, add new assignment
      if (userData.branchId) {
        const { error: branchError } = await supabase
          .from('user_branches')
          .insert({
            user_id: userId,
            branch_id: userData.branchId
          });

        if (branchError) {
          console.error('Error updating user branch:', branchError);
          // Continue even if this fails, as it's not critical
        }
      }
    } else {
      // For non-kasir roles, remove any branch assignments
      await supabase
        .from('user_branches')
        .delete()
        .eq('user_id', userId);
    }

    console.log('User updated successfully:', userId);
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserInSystem:', error);
    throw error;
  }
};
