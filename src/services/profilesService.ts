
import { supabase } from '@/integrations/supabase/client';
import { RoleType } from '@/contexts/AuthContext';

export interface ProfileData {
  id: string;
  name: string;
  role: RoleType;
  created_at: string;
  updated_at: string;
  email: string; // Add real email field
  branchId?: string;
  branchName?: string;
}

export const fetchProfilesFromDB = async (): Promise<ProfileData[]> => {
  console.log('profilesService: Starting to fetch profiles with branch data and real emails...');
  
  try {
    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // First get all profiles with branch data
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_branches (
          branch_id,
          branches!fk_user_branches_branch_id (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    console.log('profilesService: Profiles query result:', { profilesData, profilesError });

    if (profilesError) {
      console.error('profilesService: Error fetching profiles:', profilesError);
      
      // Handle specific error cases
      if (profilesError.code === 'PGRST301') {
        throw new Error('Tidak ada izin untuk mengakses data pengguna. Pastikan Anda login sebagai owner.');
      }
      
      if (profilesError.message?.includes('permission denied')) {
        throw new Error('Akses ditolak. Hanya owner yang dapat melihat daftar pengguna.');
      }
      
      throw new Error(`Gagal memuat data pengguna: ${profilesError.message}`);
    }

    if (!profilesData || profilesData.length === 0) {
      console.log('profilesService: No profiles found');
      return [];
    }

    // Get emails from auth.users using admin endpoint
    console.log('profilesService: Fetching real emails from auth system...');
    const userIds = profilesData.map(profile => profile.id);
    
    // Use admin API to get user emails (requires owner role)
    const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
    
    console.log('profilesService: Auth users result:', { 
      authUsersCount: authResponse?.users?.length, 
      authError 
    });

    // Create email mapping from auth users
    const emailMap = new Map<string, string>();
    if (authResponse?.users && !authError) {
      authResponse.users.forEach((user: any) => {
        if (user.id && user.email) {
          emailMap.set(user.id, user.email);
        }
      });
    } else {
      console.warn('profilesService: Could not fetch emails from auth system:', authError);
    }

    // Transform data to include branch information and real emails
    const typedProfiles = profilesData.map(profile => {
      console.log('Processing profile:', profile.name, 'user_branches:', profile.user_branches);
      
      // Handle the nested user_branches structure properly
      let branchId: string | undefined;
      let branchName: string | undefined;
      
      if (profile.user_branches && Array.isArray(profile.user_branches)) {
        // Get the first branch assignment
        const userBranch = profile.user_branches[0];
        
        if (userBranch && userBranch.branches && typeof userBranch.branches === 'object') {
          branchId = userBranch.branches.id;
          branchName = userBranch.branches.name;
        }
      } else if (profile.user_branches && !Array.isArray(profile.user_branches)) {
        // Handle single object case
        const userBranch = profile.user_branches;
        if (userBranch.branches && typeof userBranch.branches === 'object') {
          branchId = userBranch.branches.id;
          branchName = userBranch.branches.name;
        }
      }

      // Get real email from auth system or fallback to placeholder
      const realEmail = emailMap.get(profile.id) || `${profile.name.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      const transformedProfile = {
        ...profile,
        role: profile.role as RoleType,
        email: realEmail,
        branchId,
        branchName
      };
      
      console.log('Transformed profile:', transformedProfile.name, 'email:', realEmail, 'branch:', branchName);
      return transformedProfile;
    });

    console.log('profilesService: Successfully fetched and transformed profiles:', typedProfiles.length, 'profiles');
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
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
