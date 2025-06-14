
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('profilesService: Profiles query result:', { data, error });

    if (error) {
      console.error('profilesService: Error fetching profiles:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    // Type casting untuk memastikan role sebagai RoleType
    const typedProfiles = (data || []).map(profile => ({
      ...profile,
      role: profile.role as RoleType
    }));

    console.log('profilesService: Successfully fetched profiles:', typedProfiles);
    return typedProfiles;
  } catch (error) {
    console.error('profilesService: Error in fetchProfilesFromDB:', error);
    throw error;
  }
};

export const filterProfilesByName = (profiles: ProfileData[], searchQuery: string): ProfileData[] => {
  return profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
