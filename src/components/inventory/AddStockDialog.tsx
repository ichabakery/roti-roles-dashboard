import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Auto-select branch for kasir
  React.useEffect(() => {
    if (userRole === 'kasir_cabang' && userBranchId && branches.length > 0) {
      setBranchId(userBranchId);
    } else if (branches.length === 1) {
      setBranchId(branches[0].id);
    }
  }, [userRole, userBranchId, branches]);

  const handleSubmit = async () => {
    if (!productId || !branchId || quantity <= 0) {
      return;
    }

    setIsSubmitting(true);
    const success = await onAddStock(productId, branchId, quantity);
    
    if (success) {
      // Reset form
      setProductId('');
      setBranchId(userRole === 'kasir_cabang' && userBranchId ? userBranchId : '');
      setQuantity(0);
      onOpenChange(false);
    }
    
    setIsSubmitting(false);
  };

  const canChangeBranch = userRole !== 'kasir_cabang';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Stok Produk</DialogTitle>
          <DialogDescription>
            Tambahkan stok produk ke cabang tertentu
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product-select">Produk *</Label>
            <Select value={productId || ""} onValueChange={setProductId}>
              <SelectTrigger id="product-select">
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
            <Label htmlFor="branch-select">Cabang *</Label>
            <Select 
              value={branchId || ""} 
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
          
          <div className="grid gap-2">
            <Label htmlFor="quantity-input">Jumlah *</Label>
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
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!productId || !branchId || quantity <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
