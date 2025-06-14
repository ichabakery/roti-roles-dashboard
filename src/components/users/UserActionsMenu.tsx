
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react';
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

interface UserActionsMenuProps {
  user: UserData;
  onViewUser: (user: UserData) => void;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (user: UserData) => void;
  isDeleting: boolean;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onViewUser,
  onEditUser,
  onDeleteUser,
  isDeleting,
}) => {
  const { toast } = useToast();

  const handleDeleteClick = () => {
    if (user.role === 'owner') {
      toast({
        title: "Tidak diizinkan",
        description: "Owner tidak dapat dihapus dari sistem",
        variant: "destructive",
      });
      return;
    }
    onDeleteUser(user);
  };

  return (
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
        <DropdownMenuItem onClick={() => onViewUser(user)}>
          <Eye className="h-3 w-3 mr-2" />
          Lihat Detail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditUser(user)}>
          <Edit className="h-3 w-3 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={handleDeleteClick}
          disabled={isDeleting || user.role === 'owner'}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActionsMenu;
