
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import UserTable from '@/components/users/UserTable';
import AddUserDialog from '@/components/users/AddUserDialog';
import UserSearch from '@/components/users/UserSearch';
import { useBranches } from '@/hooks/useBranches';
import { useUsers } from '@/hooks/useUsers';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { branches, loading: branchesLoading } = useBranches();
  const { users, addUser, deleteUser, filterUsers } = useUsers();
  
  const filteredUsers = filterUsers(searchQuery);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h2>
            <p className="text-muted-foreground">
              Kelola akun pengguna dan peran akses
            </p>
          </div>
          
          <AddUserDialog 
            branches={branches}
            branchesLoading={branchesLoading}
            onAddUser={addUser}
          />
        </div>

        <UserSearch 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredUsersCount={filteredUsers.length}
          totalUsersCount={users.length}
        />
        
        <UserTable 
          users={filteredUsers}
          branches={branches}
          onDeleteUser={deleteUser}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
