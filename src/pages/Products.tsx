
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash, Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setProducts(data || []);
      
      // Show info toast about current data
      if (data && data.length === 0) {
        toast({
          title: "Info",
          description: "Database sudah bersih dari data dummy. Silakan tambah produk untuk testing.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validation
      if (!newProduct.name.trim()) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Nama produk harus diisi",
        });
        return;
      }

      if (newProduct.price <= 0) {
        toast({
          variant: "destructive",
          title: "Validasi Gagal",
          description: "Harga produk harus lebih dari 0",
        });
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name.trim(),
          description: newProduct.description.trim() || null,
          price: newProduct.price,
          active: true
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Produk Berhasil Ditambahkan",
        description: `Produk "${newProduct.name}" telah ditambahkan ke database`,
      });

      setNewProduct({ name: '', description: '', price: 0 });
      setIsAddDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan produk: ${error.message}`,
      });
    }
  };

  const handleToggleActive = async (id: string, name: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Produk Diubah",
        description: `Produk "${name}" sekarang ${!currentStatus ? 'aktif' : 'nonaktif'}`,
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal mengubah status produk: ${error.message}`,
      });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (confirm(`Anda yakin ingin menghapus produk "${name}"?\n\nPeringatan: Ini akan menghapus semua data inventory dan transaksi terkait produk ini.`)) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        toast({
          title: "🗑️ Produk Dihapus",
          description: `Produk "${name}" berhasil dihapus dari database`,
        });

        fetchProducts();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal menghapus produk: ${error.message}`,
        });
      }
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggested products for testing
  const suggestedProducts = [
    { name: 'Roti Coklat', description: 'Roti manis dengan coklat', price: 8000 },
    { name: 'Croissant', description: 'Pastry klasik Perancis', price: 12000 },
    { name: 'Donat Glazed', description: 'Donat dengan glazed manis', price: 6000 },
    { name: 'Roti Tawar', description: 'Roti tawar putih fresh', price: 15000 },
    { name: 'Kue Tart Mini', description: 'Kue tart ukuran mini', price: 25000 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Produk</h2>
            <p className="text-muted-foreground">
              Kelola data master produk toko roti - Prioritas Testing #1
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
                <DialogDescription>
                  Masukkan informasi produk yang akan ditambahkan untuk testing
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Produk *</Label>
                  <Input 
                    id="name" 
                    placeholder="Contoh: Roti Coklat"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input 
                    id="description" 
                    placeholder="Contoh: Roti manis dengan coklat premium"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="price">Harga (Rp) *</Label>
                  <Input 
                    id="price" 
                    type="number"
                    placeholder="Contoh: 8000"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAddProduct}>
                  Simpan Produk
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Testing suggestions */}
        {products.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">💡 Saran Produk untuk Testing</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <p className="mb-3">Tambahkan produk-produk berikut untuk testing yang optimal:</p>
              <div className="grid gap-2 text-sm">
                {suggestedProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-1 px-2 bg-white rounded border">
                    <span><strong>{product.name}</strong> - {product.description}</span>
                    <span className="font-bold text-green-600">Rp {product.price.toLocaleString('id-ID')}</span>
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
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {products.length} produk
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
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.description || '-'}</TableCell>
                        <TableCell className="font-semibold">Rp {product.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleToggleActive(product.id, product.name, product.active)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              product.active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {product.active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {product.active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" title="Edit produk">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              title="Hapus produk"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <>Tidak ada produk yang sesuai dengan pencarian "<strong>{searchQuery}</strong>"</>
                        ) : (
                          <>
                            <div className="text-lg mb-2">📦 Belum ada produk</div>
                            <div>Database sudah bersih dari data dummy. Klik "Tambah Produk" untuk mulai testing.</div>
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
        {products.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">✅ Testing Progress: Produk</h3>
                  <p className="text-green-700 text-sm">
                    {products.length >= 3 
                      ? `Excellent! ${products.length} produk sudah ditambahkan. Lanjut ke testing Cabang.` 
                      : `Tambahkan ${3 - products.length} produk lagi untuk testing optimal.`}
                  </p>
                </div>
                <div className="text-2xl">
                  {products.length >= 3 ? '🎉' : '📈'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Products;
