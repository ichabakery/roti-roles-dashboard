
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, PackagePlus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  product: Product;
  branch: Branch;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    product_id: '',
    branch_id: '',
    quantity: 0
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // For kasir role, auto-select their branch
    if (user?.role === 'kasir_cabang' && user.branchId) {
      setSelectedBranch(user.branchId);
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedBranch || user?.role === 'owner' || user?.role === 'admin_pusat') {
      fetchInventory();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      setBranches(data || []);
      
      // If there's only one branch or user is kasir_cabang, select it automatically
      if ((data && data.length === 1) || (user?.role === 'kasir_cabang' && user.branchId)) {
        const branchId = user?.role === 'kasir_cabang' && user.branchId 
          ? user.branchId 
          : data?.[0]?.id;
        setSelectedBranch(branchId);
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };
  
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('inventory')
        .select('id, product_id, branch_id, quantity, product:products(id, name), branch:branches(id, name)');
        
      if (selectedBranch && user?.role === 'kasir_cabang') {
        // Kasir can only see their own branch
        query = query.eq('branch_id', selectedBranch);
      } else if (selectedBranch) {
        // Filter by selected branch for other roles
        query = query.eq('branch_id', selectedBranch);
      }
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data stok: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    try {
      // Validation
      if (!newStock.product_id) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Produk harus dipilih",
        });
        return;
      }

      if (!newStock.branch_id) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Cabang harus dipilih",
        });
        return;
      }

      if (newStock.quantity <= 0) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Jumlah stok harus lebih dari 0",
        });
        return;
      }

      // Check if this product already exists in inventory for this branch
      const { data: existingItems, error: fetchError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', newStock.product_id)
        .eq('branch_id', newStock.branch_id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      let result;
      
      if (existingItems) {
        // Update existing inventory
        const newQuantity = existingItems.quantity + newStock.quantity;
        result = await supabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', existingItems.id)
          .select();
      } else {
        // Insert new inventory
        result = await supabase
          .from('inventory')
          .insert({
            product_id: newStock.product_id,
            branch_id: newStock.branch_id,
            quantity: newStock.quantity
          })
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      const productName = products.find(p => p.id === newStock.product_id)?.name;
      const branchName = branches.find(b => b.id === newStock.branch_id)?.name;

      toast({
        title: "Stok Ditambahkan",
        description: `Stok ${productName} di ${branchName} berhasil diperbarui`,
      });

      setNewStock({ product_id: '', branch_id: '', quantity: 0 });
      setIsAddDialogOpen(false);
      fetchInventory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan stok: ${error.message}`,
      });
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Stok</h2>
            <p className="text-muted-foreground">
              Kelola stok produk di setiap cabang
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchInventory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Tambah Stok
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Stok Produk</DialogTitle>
                  <DialogDescription>
                    Tambahkan stok produk ke cabang tertentu
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product">Produk</Label>
                    <Select 
                      value={newStock.product_id} 
                      onValueChange={(value) => setNewStock({ ...newStock, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="branch">Cabang</Label>
                    <Select 
                      value={newStock.branch_id} 
                      onValueChange={(value) => setNewStock({ ...newStock, branch_id: value })}
                      disabled={user?.role === 'kasir_cabang'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      value={newStock.quantity}
                      onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddStock}>
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center flex-1">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              
              {(user?.role === 'owner' || user?.role === 'admin_pusat') && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="branch-filter">Cabang:</Label>
                  <Select 
                    value={selectedBranch || ''}
                    onValueChange={setSelectedBranch}
                  >
                    <SelectTrigger id="branch-filter" className="w-[180px]">
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Cabang</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Cabang</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Terakhir Diperbarui</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{item.branch.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{new Date(item.id).toLocaleDateString('id-ID')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        {searchQuery ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Belum ada data stok'}
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

export default Inventory;
