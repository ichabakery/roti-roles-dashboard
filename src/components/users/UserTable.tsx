
import React from 'react';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';

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
  onDeleteUser: (id: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, branches, onDeleteUser }) => {
  const { toast } = useToast();

  const getRoleName = (role: RoleType) => {
    switch(role) {
      case 'owner': return 'Pemilik';
      case 'kepala_produksi': return 'Kepala Produksi';
      case 'kasir_cabang': return 'Kasir Cabang';
      case 'admin_pusat': return 'Admin Pusat';
      default: return role;
    }
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return '-';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Cabang tidak ditemukan';
  };

  const handleEdit = (user: UserData) => {
    toast({
      title: "Edit",
      description: `Edit ${user.name} (fitur akan datang)`,
    });
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
    <Table>
      <TableCaption>Daftar pengguna sistem</TableCaption>
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
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                {getRoleName(user.role)}
              </span>
            </TableCell>
            <TableCell>{getBranchName(user.branchId)}</TableCell>
            <TableCell>{user.createdAt.toLocaleDateString('id-ID')}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleEdit(user)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteUser(user.id)}
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
