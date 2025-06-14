
import { supabase } from '@/integrations/supabase/client';
import { ProfileData } from './profilesService';

export const deleteUserFromSystem = async (userId: string, profiles: ProfileData[]) => {
  console.log('Attempting to delete user:', userId);
  
  // Check if trying to delete owner
  const profile = profiles.find(p => p.id === userId);
  if (profile?.role === 'owner') {
    throw new Error('Owner tidak dapat dihapus dari sistem');
  }

  try {
    // First, delete from user_branches if exists
    const { error: branchError } = await supabase
      .from('user_branches')
      .delete()
      .eq('user_id', userId);

    if (branchError) {
      console.error('Error deleting user branches:', branchError);
      // Continue even if this fails, as the user might not have branch assignments
    }

    // Then delete from profiles (this should cascade to auth.users via triggers)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw new Error('Gagal menghapus profil pengguna: ' + profileError.message);
    }

    console.log('User deleted successfully:', userId);
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteUserFromSystem:', error);
    throw error;
  }
};
