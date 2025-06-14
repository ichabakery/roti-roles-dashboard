
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';

interface ProfileData {
  id: string;
  name: string;
  role: RoleType;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  branchId?: string;
}

export const useProfiles = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pengguna",
          variant: "destructive",
        });
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
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
      // Check if trying to delete owner
      const profile = profiles.find(p => p.id === userId);
      if (profile?.role === 'owner') {
        toast({
          title: "Tidak diizinkan",
          description: "Owner tidak dapat dihapus dari sistem",
          variant: "destructive",
        });
        return { success: false };
      }

      // Delete from auth (will cascade to profiles due to foreign key)
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }

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
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const filterProfiles = (searchQuery: string) => {
    return profiles.filter(profile => 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    loading,
    createUser,
    deleteUser,
    filterProfiles,
    refreshProfiles: fetchProfiles
  };
};
