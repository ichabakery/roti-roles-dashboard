
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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

interface EditUserDialogProps {
  user: UserData | null;
  branches: Branch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditUser: (userId: string, data: { name: string; role: RoleType; branchId?: string }) => Promise<{ success: boolean }>;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  branches,
  open,
  onOpenChange,
  onEditUser,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('kasir_cabang');
  const [branchId, setBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (user && open) {
      setName(user.name);
      setRole(user.role);
      setBranchId(user.branchId || '');
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Nama pengguna tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: { name: string; role: RoleType; branchId?: string } = {
        name: name.trim(),
        role,
      };

      // Only include branchId for kasir_cabang role
      if (role === 'kasir_cabang' && branchId) {
        updateData.branchId = branchId;
      }

      const result = await onEditUser(user.id, updateData);
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil diperbarui",
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setBranchId(user.branchId || '');
    }
    onOpenChange(false);
  };

  if (!user) return null;

  // Prevent editing owner
  if (user.role === 'owner') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Owner tidak dapat diedit
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Data owner sistem tidak dapat diubah untuk menjaga keamanan sistem.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah informasi pengguna. Klik simpan untuk menyimpan perubahan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama pengguna"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Peran</Label>
              <Select 
                value={role} 
                onValueChange={(value: RoleType) => setRole(value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
                  <SelectItem value="kepala_produksi">Kepala Produksi</SelectItem>
                  <SelectItem value="kasir_cabang">Kasir Cabang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'kasir_cabang' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-branch">Cabang</Label>
                <Select 
                  value={branchId} 
                  onValueChange={setBranchId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
