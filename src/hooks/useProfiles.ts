
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchProfilesFromDB, filterProfilesByName, ProfileData } from '@/services/profilesService';
import { createUserInSystem, CreateUserData } from '@/services/userCreationService';
import { deleteUserFromSystem } from '@/services/userDeletionService';
import { updateUserInSystem, UpdateUserData } from '@/services/userUpdateService';

export type { ProfileData, CreateUserData };
export type { UpdateUserData };

export const useProfiles = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      console.log('useProfiles: Starting fetchProfiles...');
      setLoading(true);
      setError(null);
      
      const profilesData = await fetchProfilesFromDB();
      console.log('useProfiles: Fetched profiles successfully:', profilesData.length, 'profiles');
      setProfiles(profilesData);
    } catch (error: any) {
      console.error('useProfiles: Error in fetchProfiles:', error);
      setError(error.message);
      
      // Only show toast for non-permission errors to avoid spamming
      if (!error.message?.includes('tidak ada izin') && !error.message?.includes('akses ditolak')) {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat data pengguna",
          variant: "destructive",
        });
      }
    } finally {
      console.log('useProfiles: Setting loading to false');
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      await createUserInSystem(userData);
      
      toast({
        title: "Berhasil",
        description: "Pengguna baru berhasil ditambahkan",
      });

      // Refresh profiles list
      await fetchProfiles();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = "Gagal membuat pengguna baru";
      if (error.message?.includes("User already registered")) {
        errorMessage = "Email sudah terdaftar dalam sistem";
      } else if (error.message?.includes("Password")) {
        errorMessage = "Password harus minimal 6 karakter";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      await updateUserInSystem(userId, userData, profiles);

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil diperbarui",
      });

      // Refresh profiles list
      await fetchProfiles();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data pengguna",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteUserFromSystem(userId, profiles);

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      });

      // Refresh profiles list
      await fetchProfiles();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pengguna",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const filterProfiles = (searchQuery: string) => {
    return filterProfilesByName(profiles, searchQuery);
  };

  useEffect(() => {
    console.log('useProfiles: useEffect triggered, starting to fetch profiles');
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    filterProfiles,
    refreshProfiles: fetchProfiles
  };
};
