
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { Check, MoreHorizontal, Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, RoleType } from '@/contexts/AuthContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
  createdAt: Date;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk form tambah user baru
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir_cabang' as RoleType,
    branchId: '1',
  });

  // Data dummy untuk users
  const [users, setUsers] = useState<UserData[]>([
    { 
      id: '1', 
      name: 'Owner', 
      email: 'owner@bakeryguru.com', 
      role: 'owner',
      createdAt: new Date('2023-01-10') 
    },
    { 
      id: '2', 
      name: 'Kepala Produksi', 
      email: 'produksi@bakeryguru.com', 
      role: 'kepala_produksi',
      createdAt: new Date('2023-03-15') 
    },
    { 
      id: '3', 
      name: 'Kasir Cabang Utama', 
      email: 'kasir@bakeryguru.com', 
      role: 'kasir_cabang',
      branchId: '1',
      createdAt: new Date('2023-05-22') 
    },
    { 
      id: '4', 
      name: 'Admin Pusat', 
      email: 'admin@bakeryguru.com', 
      role: 'admin_pusat',
      createdAt: new Date('2023-08-05') 
    },
  ]);
  
  // Data dummy untuk cabang
  const branches = [
    { id: '1', name: 'Cabang Utama' },
    { id: '2', name: 'Cabang Timur' },
    { id: '3', name: 'Cabang Barat' },
  ];

  const getRoleName = (role: RoleType) => {
    switch(role) {
      case 'owner': return 'Pemilik';
      case 'kepala_produksi': return 'Kepala Produksi';
      case 'kasir_cabang': return 'Kasir Cabang';
      case 'admin_pusat': return 'Admin Pusat';
      default: return role;
    }
  };
  
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi",
        variant: "destructive",
      });
      return;
    }

    const newId = (users.length + 1).toString();
    const userData: UserData = {
      id: newId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: new Date(),
      ...(newUser.role === 'kasir_cabang' ? { branchId: newUser.branchId } : {})
    };

    setUsers([...users, userData]);
    setIsDialogOpen(false);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'kasir_cabang',
      branchId: '1',
    });
    
    toast({
      title: "Berhasil",
      description: "Pengguna baru berhasil ditambahkan",
    });
  };
  
  const handleDeleteUser = (id: string) => {
    // Jangan izinkan menghapus owner
    const userToDelete = users.find(user => user.id === id);
    if (userToDelete?.role === 'owner') {
      toast({
        title: "Tidak diizinkan",
        description: "Owner tidak dapat dihapus dari sistem",
        variant: "destructive",
      });
      return;
    }
    
    setUsers(users.filter(user => user.id !== id));
    toast({
      title: "Berhasil",
      description: "Pengguna berhasil dihapus",
    });
  };
  
  // Filter users berdasarkan search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser({...newUser, role: value as RoleType})}
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
                    <Select 
                      value={newUser.branchId} 
                      onValueChange={(value) => setNewUser({...newUser, branchId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddUser}>
                  <Check className="mr-2 h-4 w-4" />
                  Tambah
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-md p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
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
              {filteredUsers.map((user) => {
                const branch = user.branchId 
                  ? branches.find((b) => b.id === user.branchId)?.name 
                  : '-';
                  
                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {getRoleName(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>{branch}</TableCell>
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
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Edit",
                                description: `Edit ${user.name} (fitur akan datang)`,
                              });
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <Users className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Tidak ada pengguna ditemukan</h3>
              <p className="text-sm text-muted-foreground">
                Coba kata kunci yang berbeda atau tambahkan pengguna baru
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
