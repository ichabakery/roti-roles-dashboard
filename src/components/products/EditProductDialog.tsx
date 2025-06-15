
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProductType, Product } from '@/types/products';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: () => void;
}

export const EditProductDialog: React.FC<EditProductDialogProps> = ({ 
  product,
  open,
  onOpenChange,
  onProductUpdated 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    productType: 'regular' as ProductType,
  });
  const { toast } = useToast();
  const { changeProductType } = useEnhancedProducts();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        productType: product.product_type,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);

    try {
      // Update product type if changed
      if (formData.productType !== product.product_type) {
        await changeProductType(product.id, formData.productType);
      }

      toast({
        title: "Berhasil",
        description: "Produk berhasil diperbarui",
      });

      onOpenChange(false);
      onProductUpdated?.();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Produk</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Produk</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Masukkan nama produk"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Deskripsi</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Masukkan deskripsi produk"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-price">Harga</Label>
            <Input
              id="edit-price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="Masukkan harga produk"
              min="0"
              step="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-productType">Jenis Produk</Label>
            <Select 
              value={formData.productType} 
              onValueChange={(value: ProductType) => handleInputChange('productType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Produk Reguler</SelectItem>
                <SelectItem value="package">Produk Paket</SelectItem>
                <SelectItem value="bundle">Produk Bundling</SelectItem>
              </SelectContent>
            </Select>
            {formData.productType !== product.product_type && (
              <p className="text-xs text-amber-600">
                ⚠️ Mengubah jenis produk dapat mempengaruhi data existing
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
