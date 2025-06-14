
import { supabase } from '@/integrations/supabase/client';
import { RoleType } from '@/contexts/AuthContext';

export interface ProfileData {
  id: string;
  name: string;
  role: RoleType;
  created_at: string;
  updated_at: string;
}

export const fetchProfilesFromDB = async (): Promise<ProfileData[]> => {
  console.log('profilesService: Starting to fetch profiles...');
  
  try {
    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    console.log('profilesService: Profiles query result:', { data, error });

    if (error) {
      console.error('profilesService: Error fetching profiles:', error);
      
      // Handle specific error cases
      if (error.code === 'PGRST301') {
        throw new Error('Tidak ada izin untuk mengakses data pengguna. Pastikan Anda login sebagai owner.');
      }
      
      if (error.message?.includes('permission denied')) {
        throw new Error('Akses ditolak. Hanya owner yang dapat melihat daftar pengguna.');
      }
      
      throw new Error(`Gagal memuat data pengguna: ${error.message}`);
    }

    // Type casting untuk memastikan role sebagai RoleType
    const typedProfiles = (data || []).map(profile => ({
      ...profile,
      role: profile.role as RoleType
    }));

    console.log('profilesService: Successfully fetched profiles:', typedProfiles);
    return typedProfiles;
  } catch (error: any) {
    console.error('profilesService: Error in fetchProfilesFromDB:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: Gagal memuat data dalam waktu yang ditentukan. Silakan coba lagi.');
    }
    
    throw error;
  }
};

export const filterProfilesByName = (profiles: ProfileData[], searchQuery: string): ProfileData[] => {
  return profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
