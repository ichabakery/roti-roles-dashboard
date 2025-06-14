
import { supabase } from '@/integrations/supabase/client';
import { ProfileData } from './profilesService';

export const deleteUserFromSystem = async (userId: string, profiles: ProfileData[]) => {
  // Check if trying to delete owner
  const profile = profiles.find(p => p.id === userId);
  if (profile?.role === 'owner') {
    throw new Error('Owner tidak dapat dihapus dari sistem');
  }

  // Delete from auth (will cascade to profiles due to foreign key)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }

  return { success: true };
};
