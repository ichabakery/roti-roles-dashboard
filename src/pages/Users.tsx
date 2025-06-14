
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import UserTable from '@/components/users/UserTable';
import AddUserDialog from '@/components/users/AddUserDialog';
import UserSearch from '@/components/users/UserSearch';
import { useBranches } from '@/hooks/useBranches';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading: authLoading } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const { users, addUser, deleteUser, filterUsers, loading: usersLoading } = useUsers();
  
  console.log('UserManagement render - authLoading:', authLoading, 'usersLoading:', usersLoading, 'user:', user);
  
  const filteredUsers = filterUsers(searchQuery);

  // Show loading if auth is still loading
  if (authLoading) {
    console.log('UserManagement: Showing auth loading...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Memuat autentikasi...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission
  if (!user || user.role !== 'owner') {
    console.log('UserManagement: User not authorized:', user?.role);
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium">Akses Ditolak</h3>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses halaman ini.
              {user?.role && ` Role Anda: ${user.role}`}
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        
        {usersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Memuat data pengguna...</span>
          </div>
        ) : (
          <UserTable 
            users={filteredUsers}
            branches={branches}
            onDeleteUser={deleteUser}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
