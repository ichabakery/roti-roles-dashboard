
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Users, Trash2, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';
import UserDetailDialog from './UserDetailDialog';
import EditUserDialog from './EditUserDialog';

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

  const getRoleName = (role: RoleType) => {
    switch(role) {
      case 'owner': return 'Pemilik';
      case 'kepala_produksi': return 'Kepala Produksi';
      case 'kasir_cabang': return 'Kasir Cabang';
      case 'admin_pusat': return 'Admin Pusat';
      default: return role;
    }
  };

  const getRoleColor = (role: RoleType) => {
    switch(role) {
      case 'owner': return 'bg-red-100 text-red-800';
      case 'kepala_produksi': return 'bg-blue-100 text-blue-800';
      case 'kasir_cabang': return 'bg-green-100 text-green-800';
      case 'admin_pusat': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return '-';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Cabang tidak ditemukan';
  };

  const handleViewUser = (user: UserData) => {
    setUserToView(user);
  };

  const handleEditUser = (user: UserData) => {
    setUserToEdit(user);
  };

  const handleDeleteClick = (user: UserData) => {
    if (user.role === 'owner') {
      toast({
        title: "Tidak diizinkan",
        description: "Owner tidak dapat dihapus dari sistem",
        variant: "destructive",
      });
      return;
    }
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
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Users className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Belum ada pengguna</h3>
        <p className="text-sm text-muted-foreground">
          Klik "Tambah Pengguna" untuk mulai mengelola pengguna sistem
        </p>
      </div>
    );
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
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleName(user.role)}
                </span>
              </TableCell>
              <TableCell>{getBranchName(user.branchId)}</TableCell>
              <TableCell>{user.createdAt.toLocaleDateString('id-ID')}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Buka menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleViewUser(user)}>
                      <Eye className="h-3 w-3 mr-2" />
                      Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(user)}
                      disabled={deletingUserId === user.id || user.role === 'owner'}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={userToView}
        branches={branches}
        open={!!userToView}
        onOpenChange={(open) => !open && setUserToView(null)}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={userToEdit}
        branches={branches}
        open={!!userToEdit}
        onOpenChange={(open) => !open && setUserToEdit(null)}
        onEditUser={handleEditUserSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{userToDelete?.name}</strong>?
              <br />
              <span className="text-destructive">Tindakan ini tidak dapat dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingUserId}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!!deletingUserId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUserId ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserTable;
