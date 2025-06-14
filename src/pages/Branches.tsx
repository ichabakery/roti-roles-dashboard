
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Search, MapPin, Phone, Building } from 'lucide-react';
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
      
      if (data && data.length === 0) {
        toast({
          title: "Info",
          description: "Belum ada cabang. Tambahkan 2-3 cabang untuk testing optimal.",
        });
      }
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
      if (!newBranch.name.trim()) {
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
          name: newBranch.name.trim(),
          address: newBranch.address.trim() || null,
          phone: newBranch.phone.trim() || null
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Cabang Berhasil Ditambahkan",
        description: `Cabang "${newBranch.name}" telah ditambahkan ke database`,
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
    if (confirm(`Anda yakin ingin menghapus cabang "${name}"?\n\nPeringatan: Ini akan menghapus semua data inventory dan transaksi terkait cabang ini.`)) {
      try {
        const { error } = await supabase
          .from('branches')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "🗑️ Cabang Dihapus",
          description: `Cabang "${name}" berhasil dihapus dari database`,
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

  // Suggested branches for testing
  const suggestedBranches = [
    { name: 'Cabang Pusat', address: 'Jl. Raya Utama No. 123, Jakarta Pusat', phone: '021-1234567' },
    { name: 'Cabang Selatan', address: 'Jl. TB Simatupang No. 456, Jakarta Selatan', phone: '021-7891234' },
    { name: 'Cabang Timur', address: 'Jl. Ahmad Yani No. 789, Jakarta Timur', phone: '021-5678901' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Cabang</h2>
            <p className="text-muted-foreground">
              Kelola data cabang toko roti - Prioritas Testing #2
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
                  Masukkan informasi cabang yang akan ditambahkan untuk testing
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Cabang *</Label>
                  <Input 
                    id="name" 
                    placeholder="Contoh: Cabang Pusat"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input 
                    id="address" 
                    placeholder="Contoh: Jl. Raya Utama No. 123, Jakarta"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input 
                    id="phone" 
                    placeholder="Contoh: 021-1234567"
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
                  Simpan Cabang
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Testing suggestions */}
        {branches.length === 0 && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-800">💡 Saran Cabang untuk Testing</CardTitle>
            </CardHeader>
            <CardContent className="text-purple-700">
              <p className="mb-3">Tambahkan cabang-cabang berikut untuk testing yang optimal:</p>
              <div className="grid gap-2 text-sm">
                {suggestedBranches.map((branch, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <div className="font-bold flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {branch.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      {branch.address}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="h-3 w-3" />
                      {branch.phone}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari cabang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {branches.length} cabang
              </div>
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
                        <TableCell className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {branch.name}
                        </TableCell>
                        <TableCell>
                          {branch.address ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {branch.address}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {branch.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {branch.phone}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" title="Edit cabang">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteBranch(branch.id, branch.name)}
                              title="Hapus cabang"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <>Tidak ada cabang yang sesuai dengan pencarian "<strong>{searchQuery}</strong>"</>
                        ) : (
                          <>
                            <div className="text-lg mb-2">🏢 Belum ada cabang</div>
                            <div>Klik "Tambah Cabang" untuk mulai testing manajemen cabang.</div>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Testing progress indicator */}
        {branches.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">✅ Testing Progress: Cabang</h3>
                  <p className="text-green-700 text-sm">
                    {branches.length >= 2 
                      ? `Excellent! ${branches.length} cabang sudah ditambahkan. Lanjut ke testing Pengguna.` 
                      : `Tambahkan ${2 - branches.length} cabang lagi untuk testing optimal.`}
                  </p>
                </div>
                <div className="text-2xl">
                  {branches.length >= 2 ? '🎉' : '📈'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchesManagement;
