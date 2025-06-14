
import { useProfiles } from './useProfiles';
import { useBranchManagement } from './useBranchManagement';
import { RoleType } from '@/contexts/AuthContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
  createdAt: Date;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  branchId?: string;
}

interface UpdateUser {
  name: string;
  role: RoleType;
  branchId?: string;
}

export const useUsers = () => {
  const { profiles, loading, createUser, deleteUser, updateUser, filterProfiles } = useProfiles();
  const { getUserBranches } = useBranchManagement();

  // Transform profiles to UserData format for compatibility
  const users: UserData[] = profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    email: `${profile.name.toLowerCase().replace(/\s+/g, '')}@example.com`, // Placeholder email
    role: profile.role,
    createdAt: new Date(profile.created_at)
  }));

  const addUser = async (newUserData: NewUser) => {
    console.log('useUsers: Adding new user:', newUserData);
    return await createUser(newUserData);
  };

  const editUser = async (userId: string, updateData: UpdateUser) => {
    console.log('useUsers: Editing user:', userId, updateData);
    
    try {
      const result = await updateUser(userId, updateData);
      
      if (result.success) {
        console.log('User updated successfully, checking branch assignment...');
        
        // Log branch assignment for verification
        if (updateData.role === 'kasir_cabang' && updateData.branchId) {
          const userBranches = await getUserBranches(userId);
          console.log('User branches after update:', userBranches);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in editUser:', error);
      throw error;
    }
  };

  const deleteUserById = async (id: string) => {
    console.log('useUsers: Deleting user:', id);
    return await deleteUser(id);
  };

  const filterUsers = (searchQuery: string) => {
    const filteredProfiles = filterProfiles(searchQuery);
    return filteredProfiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      email: `${profile.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      role: profile.role,
      createdAt: new Date(profile.created_at)
    }));
  };

  return {
    users,
    loading,
    addUser,
    editUser,
    deleteUser: deleteUserById,
    filterUsers
  };
};
