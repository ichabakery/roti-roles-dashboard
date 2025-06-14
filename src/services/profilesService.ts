
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
  console.log('Starting to fetch profiles...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('Profiles query result:', { data, error });

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  // Type casting untuk memastikan role sebagai RoleType
  const typedProfiles = (data || []).map(profile => ({
    ...profile,
    role: profile.role as RoleType
  }));

  console.log('Fetched profiles:', typedProfiles);
  return typedProfiles;
};

export const filterProfilesByName = (profiles: ProfileData[], searchQuery: string): ProfileData[] => {
  return profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
