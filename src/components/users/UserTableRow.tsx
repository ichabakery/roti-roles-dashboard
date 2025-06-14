
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { RoleType } from '@/contexts/AuthContext';
import UserActionsMenu from './UserActionsMenu';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
  branchName?: string;
  createdAt: Date;
}

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface UserTableRowProps {
  user: UserData;
  branches: Branch[];
  onViewUser: (user: UserData) => void;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (user: UserData) => void;
  isDeleting: boolean;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  branches,
  onViewUser,
  onEditUser,
  onDeleteUser,
  isDeleting,
}) => {
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

  const getBranchName = () => {
    // Prioritas menggunakan branchName dari data user (hasil join database)
    if (user.branchName) {
      return user.branchName;
    }
    
    // Fallback ke pencarian manual di array branches jika branchId ada
    if (user.branchId) {
      const branch = branches.find(b => b.id === user.branchId);
      return branch ? branch.name : 'Cabang tidak ditemukan';
    }
    
    return '-';
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
          {getRoleName(user.role)}
        </span>
      </TableCell>
      <TableCell>{getBranchName()}</TableCell>
      <TableCell>{user.createdAt.toLocaleDateString('id-ID')}</TableCell>
      <TableCell className="text-right">
        <UserActionsMenu
          user={user}
          onViewUser={onViewUser}
          onEditUser={onEditUser}
          onDeleteUser={onDeleteUser}
          isDeleting={isDeleting}
        />
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
