import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PackagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomProduct {
  name: string;
  price: number;
  description: string;
  quantity: number;
}

interface CustomProductDialogProps {
  open: boolean;
  onClose: () => void;
  onAddCustomProduct: (customProduct: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    availableStock: number;
  }) => void;
}

const CustomProductDialog: React.FC<CustomProductDialogProps> = ({
  open,
  onClose,
  onAddCustomProduct
}) => {
  const [customProduct, setCustomProduct] = useState<CustomProduct>({
    name: '',
    price: 0,
    description: '',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!customProduct.name || customProduct.price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Nama produk dan harga harus diisi dengan benar'
      });
      return;
    }

    setLoading(true);
    try {
      // Create custom product in database
      const { data, error } = await supabase.rpc('create_custom_product', {
        p_name: customProduct.name,
        p_price: customProduct.price,
        p_description: customProduct.description || null
      });

      if (error) throw error;

      // Add custom product to order
      onAddCustomProduct({
        productId: data,
        productName: customProduct.name,
        quantity: customProduct.quantity,
        unitPrice: customProduct.price,
        availableStock: 0 // Custom products don't have existing stock
      });

      toast({
        title: 'Berhasil',
        description: 'Produk custom berhasil ditambahkan ke pesanan'
      });

      // Reset form and close dialog
      setCustomProduct({ name: '', price: 0, description: '', quantity: 1 });
      onClose();
    } catch (error) {
      console.error('Error adding custom product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menambahkan produk custom'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Tambah Produk Custom
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="custom-name">Nama Produk *</Label>
            <Input
              id="custom-name"
              value={customProduct.name}
              onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Masukkan nama produk"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom-price">Harga *</Label>
            <Input
              id="custom-price"
              type="number"
              value={customProduct.price || ''}
              onChange={(e) => setCustomProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
              placeholder="Masukkan harga"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom-description">Deskripsi (Opsional)</Label>
            <Textarea
              id="custom-description"
              value={customProduct.description}
              onChange={(e) => setCustomProduct(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi produk custom"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custom-quantity">Jumlah</Label>
            <Input
              id="custom-quantity"
              type="number"
              min="1"
              value={customProduct.quantity}
              onChange={(e) => setCustomProduct(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customProduct.name || customProduct.price <= 0 || loading}
            className="flex-1"
          >
            {loading ? 'Menambah...' : 'Tambah Produk'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomProductDialog;