
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Search, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

const BranchesManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    phone: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    try {
      // Validation
      if (!newBranch.name) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Nama cabang harus diisi",
        });
        return;
      }

      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: newBranch.name,
          address: newBranch.address || null,
          phone: newBranch.phone || null
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Cabang Ditambahkan",
        description: `Cabang ${newBranch.name} berhasil ditambahkan`,
      });

      setNewBranch({ name: '', address: '', phone: '' });
      setIsAddDialogOpen(false);
      fetchBranches();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan cabang: ${error.message}`,
      });
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (confirm(`Anda yakin ingin menghapus cabang "${name}"?`)) {
      try {
        const { error } = await supabase
          .from('branches')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "Cabang Dihapus",
          description: `Cabang ${name} berhasil dihapus`,
        });

        fetchBranches();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal menghapus cabang: ${error.message}`,
        });
      }
    }
  };

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Cabang</h2>
            <p className="text-muted-foreground">
              Kelola data cabang toko roti
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Cabang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Cabang Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi cabang yang akan ditambahkan
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Cabang</Label>
                  <Input 
                    id="name" 
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input 
                    id="address" 
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input 
                    id="phone" 
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddBranch}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari cabang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Cabang</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>{branch.address || '-'}</TableCell>
                        <TableCell>{branch.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteBranch(branch.id, branch.name)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        {searchQuery ? 'Tidak ada cabang yang sesuai dengan pencarian' : 'Belum ada cabang yang ditambahkan'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchesManagement;
