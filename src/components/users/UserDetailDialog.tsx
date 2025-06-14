
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Mail, User, MapPin } from 'lucide-react';
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

interface UserDetailDialogProps {
  user: UserData | null;
  branches: Branch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  user,
  branches,
  open,
  onOpenChange,
}) => {
  if (!user) return null;

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
      case 'owner': return 'destructive';
      case 'kepala_produksi': return 'default';
      case 'kasir_cabang': return 'secondary';
      case 'admin_pusat': return 'outline';
      default: return 'default';
    }
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'Tidak ada cabang';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Cabang tidak ditemukan';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detail Pengguna
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap pengguna sistem
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nama</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={getRoleColor(user.role)} className="w-fit">
                {getRoleName(user.role)}
              </Badge>
              <div>
                <p className="text-sm font-medium">Peran</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cabang</p>
                <p className="text-sm text-muted-foreground">{getBranchName(user.branchId)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tanggal Dibuat</p>
                <p className="text-sm text-muted-foreground">
                  {user.createdAt.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog;
