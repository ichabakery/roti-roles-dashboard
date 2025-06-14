
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';
import UserDetailDialog from './UserDetailDialog';
import EditUserDialog from './EditUserDialog';
import DeleteUserDialog from './DeleteUserDialog';
import UserTableRow from './UserTableRow';
import EmptyUserState from './EmptyUserState';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
  createdAt: Date;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface UserTableProps {
  users: UserData[];
  branches: Branch[];
  onDeleteUser: (id: string) => Promise<{ success: boolean }>;
  onEditUser: (userId: string, data: { name: string; role: RoleType; branchId?: string }) => Promise<{ success: boolean }>;
}

const UserTable: React.FC<UserTableProps> = ({ users, branches, onDeleteUser, onEditUser }) => {
  const { toast } = useToast();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [userToView, setUserToView] = useState<UserData | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);

  const handleViewUser = (user: UserData) => {
    setUserToView(user);
  };

  const handleEditUser = (user: UserData) => {
    setUserToEdit(user);
  };

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    try {
      console.log('Deleting user:', userToDelete.name, userToDelete.id);
      const result = await onDeleteUser(userToDelete.id);
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: `Pengguna ${userToDelete.name} berhasil dihapus`,
        });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pengguna",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  const handleEditUserSubmit = async (userId: string, data: { name: string; role: RoleType; branchId?: string }) => {
    return await onEditUser(userId, data);
  };

  if (users.length === 0) {
    return <EmptyUserState />;
  }

  return (
    <>
      <Table>
        <TableCaption>Daftar pengguna sistem ({users.length} pengguna)</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Peran</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Tanggal Dibuat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              branches={branches}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteClick}
              isDeleting={deletingUserId === user.id}
            />
          ))}
        </TableBody>
      </Table>

      <UserDetailDialog
        user={userToView}
        branches={branches}
        open={!!userToView}
        onOpenChange={(open) => !open && setUserToView(null)}
      />

      <EditUserDialog
        user={userToEdit}
        branches={branches}
        open={!!userToEdit}
        onOpenChange={(open) => !open && setUserToEdit(null)}
        onEditUser={handleEditUserSubmit}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={!!deletingUserId}
      />
    </>
  );
};

export default UserTable;
