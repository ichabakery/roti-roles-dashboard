
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchProfilesFromDB, filterProfilesByName, ProfileData } from '@/services/profilesService';
import { createUserInSystem, CreateUserData } from '@/services/userCreationService';
import { deleteUserFromSystem } from '@/services/userDeletionService';

export type { ProfileData, CreateUserData };

export const useProfiles = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const profilesData = await fetchProfilesFromDB();
      setProfiles(profilesData);
    } catch (error: any) {
      console.error('Error in fetchProfiles:', error);
      setError(error.message);
      
      // Don't show toast for permission errors (user might not be owner)
      if (!error.message?.includes('permission') && !error.message?.includes('policy')) {
        toast({
          title: "Error",
          description: "Gagal memuat data pengguna",
          variant: "destructive",
        });
      }
    } finally {
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
    console.log('useProfiles useEffect triggered');
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    createUser,
    deleteUser,
    filterProfiles,
    refreshProfiles: fetchProfiles
  };
};
