import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  branches: Branch[];
  onAddStock: (productId: string, branchId: string, quantity: number) => Promise<boolean>;
  userRole?: string;
  userBranchId?: string;
}

export const AddStockDialog: React.FC<AddStockDialogProps> = ({
  open,
  onOpenChange,
  products,
  branches,
  onAddStock,
  userRole,
  userBranchId
}) => {
  // Jika role kasir cabang, render null (tidak boleh akses UI sama sekali)
  if (userRole === "kasir_cabang") return null;

  const [productId, setProductId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-select branch for kasir
  React.useEffect(() => {
    if (userRole === 'kasir_cabang' && userBranchId && branches.length > 0) {
      setBranchId(userBranchId);
    } else if (branches.length === 1) {
      setBranchId(branches[0].id);
    }
  }, [userRole, userBranchId, branches]);

  const resetForm = () => {
    setProductId('');
    setBranchId(userRole === 'kasir_cabang' && userBranchId ? userBranchId : '');
    setQuantity(0);
    setIsSubmitting(false);
    setSearchQuery('');
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleSubmit = async () => {
    if (!productId || !branchId || quantity <= 0) {
      return;
    }

    setIsSubmitting(true);
    const success = await onAddStock(productId, branchId, quantity);
    
    if (success) {
      resetForm();
      onOpenChange(false);
    }
    
    setIsSubmitting(false);
  };

  const canChangeBranch = userRole !== 'kasir_cabang';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Stok Produk</DialogTitle>
          <DialogDescription>
            Tambahkan stok produk ke cabang tertentu
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Product Selection with Search */}
          <div className="grid gap-2">
            <Label htmlFor="product-search" className="text-sm font-medium">
              Produk *
            </Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="product-search"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {searchQuery ? 'Tidak ada produk ditemukan' : 'Tidak ada produk tersedia'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Branch Selection */}
          <div className="grid gap-2">
            <Label htmlFor="branch-select" className="text-sm font-medium">
              Cabang *
            </Label>
            <Select 
              value={branchId} 
              onValueChange={setBranchId}
              disabled={!canChangeBranch}
            >
              <SelectTrigger id="branch-select">
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
          
          {/* Quantity Input */}
          <div className="grid gap-2">
            <Label htmlFor="quantity-input" className="text-sm font-medium">
              Jumlah *
            </Label>
            <Input 
              id="quantity-input" 
              type="number"
              min="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Masukkan jumlah stok"
            />
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!productId || !branchId || quantity <= 0 || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};