
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoleType } from '@/contexts/AuthContext';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  branchId: string;
}

interface AddUserDialogProps {
  branches: Branch[];
  branchesLoading: boolean;
  onAddUser: (userData: NewUser) => Promise<{ success: boolean; error?: string }>;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ 
  branches, 
  branchesLoading, 
  onAddUser 
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'kasir_cabang',
    branchId: '',
  });

  useEffect(() => {
    if (branches.length > 0 && !newUser.branchId) {
      setNewUser(prev => ({ ...prev, branchId: branches[0].id }));
    }
  }, [branches, newUser.branchId]);

  const validateForm = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi",
        variant: "destructive",
      });
      return false;
    }

    if (newUser.role === 'kasir_cabang' && !newUser.branchId) {
      toast({
        title: "Error", 
        description: "Pilih cabang untuk kasir cabang",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return false;
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Error",
        description: "Password harus minimal 6 karakter",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await onAddUser(newUser);
      
      if (result.success) {
        setIsDialogOpen(false);
        // Reset form
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'kasir_cabang',
          branchId: branches.length > 0 ? branches[0].id : '',
        });
      }
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (value: string) => {
    setNewUser({...newUser, role: value as RoleType});
    if (value !== 'kasir_cabang') {
      setNewUser(prev => ({...prev, branchId: ''}));
    } else if (branches.length > 0) {
      setNewUser(prev => ({...prev, branchId: branches[0].id}));
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          <DialogDescription>
            Isi informasi pengguna baru dan pilih peran akses
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input 
              id="name" 
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              placeholder="Nama Lengkap" 
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="email@example.com" 
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              placeholder="******" 
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Password minimal 6 karakter
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Peran</Label>
            <Select 
              value={newUser.role} 
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kepala_produksi">Kepala Produksi</SelectItem>
                <SelectItem value="kasir_cabang">Kasir Cabang</SelectItem>
                <SelectItem value="admin_pusat">Admin Pusat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {newUser.role === 'kasir_cabang' && (
            <div className="space-y-2">
              <Label htmlFor="branch">Cabang</Label>
              {branchesLoading ? (
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Memuat cabang...</span>
                </div>
              ) : branches.length > 0 ? (
                <Select 
                  value={newUser.branchId} 
                  onValueChange={(value) => setNewUser({...newUser, branchId: value})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.address && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({branch.address})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Belum ada cabang tersedia. 
                    <a href="/branches" className="underline font-medium ml-1">
                      Tambahkan cabang terlebih dahulu
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button 
            onClick={handleAddUser}
            disabled={
              isLoading || 
              (newUser.role === 'kasir_cabang' && (branches.length === 0 || !newUser.branchId))
            }
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Tambah
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
