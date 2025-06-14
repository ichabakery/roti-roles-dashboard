
import { supabase } from '@/integrations/supabase/client';
import { RoleType } from '@/contexts/AuthContext';
import { ProfileData } from './profilesService';

export interface UpdateUserData {
  name: string;
  role: RoleType;
  branchId?: string;
}

export const updateUserInSystem = async (userId: string, userData: UpdateUserData, currentProfiles: ProfileData[]) => {
  console.log('updateUserInSystem: Starting update for user:', userId, userData);

  try {
    // Update profile data
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
      throw new Error('Gagal memperbarui profil pengguna');
    }

    console.log('Profile updated successfully');

    // Handle branch assignment for kasir_cabang
    if (userData.role === 'kasir_cabang' && userData.branchId) {
      console.log('Assigning kasir to branch:', userData.branchId);
      
      // First, remove any existing branch assignments for this user
      const { error: deleteError } = await supabase
        .from('user_branches')
        .delete()
        .eq('user_id', userId);

      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error('Error removing existing branch assignments:', deleteError);
        // Don't throw error here, just log it as it might not exist
      }

      // Add new branch assignment
      const { error: branchError } = await supabase
        .from('user_branches')
        .insert({
          user_id: userId,
          branch_id: userData.branchId
        });

      if (branchError) {
        console.error('Error assigning user to branch:', branchError);
        throw new Error('Gagal mengassign pengguna ke cabang');
      }

      console.log('User successfully assigned to branch');
    } else if (userData.role !== 'kasir_cabang') {
      // If role is not kasir_cabang, remove any existing branch assignments
      console.log('Removing branch assignments for non-kasir role');
      
      const { error: deleteError } = await supabase
        .from('user_branches')
        .delete()
        .eq('user_id', userId);

      if (deleteError && deleteError.code !== 'PGRST116') {
        console.error('Error removing branch assignments:', deleteError);
        // Don't throw error here, just log it
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserInSystem:', error);
    throw error;
  }
};
