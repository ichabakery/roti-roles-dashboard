
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { ProductType } from '@/types/products';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';
import { ProductExpiryCalendar } from './ProductExpiryCalendar';
import { PRODUCT_CATEGORIES, DEFAULT_CATEGORY } from '@/constants/productCategories';

interface EnhancedAddProductDialogProps {
  onProductAdded?: () => void;
}

export const EnhancedAddProductDialog: React.FC<EnhancedAddProductDialogProps> = ({ 
  onProductAdded 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: DEFAULT_CATEGORY,
    productType: 'regular' as ProductType,
    hasExpiry: false,
    defaultExpiryDays: '',
    expiryDate: undefined as Date | undefined,
  });
  const { toast } = useToast();
  const { addProduct } = useEnhancedProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        productType: formData.productType,
      });

      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        category: DEFAULT_CATEGORY,
        productType: 'regular',
        hasExpiry: false,
        defaultExpiryDays: '',
        expiryDate: undefined,
      });
      setOpen(false);
      onProductAdded?.();
    } catch (error: any) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Masukkan nama produk"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Masukkan deskripsi produk"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Harga</Label>
            <Input
              id="price"
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
            <Label htmlFor="category">Kategori</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">Jenis Produk</Label>
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
            <p className="text-xs text-muted-foreground">
              {formData.productType === 'regular' && 'Produk biasa yang dijual satuan'}
              {formData.productType === 'package' && 'Kumpulan produk yang dijual sebagai satu kesatuan'}
              {formData.productType === 'bundle' && 'Kombinasi produk dengan harga spesial'}
            </p>
          </div>

          {formData.productType === 'regular' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExpiry"
                  checked={formData.hasExpiry}
                  onCheckedChange={(checked) => handleInputChange('hasExpiry', checked as boolean)}
                />
                <Label htmlFor="hasExpiry" className="text-sm font-medium">
                  Produk ini memiliki tanggal kadaluarsa
                </Label>
              </div>
              
              {formData.hasExpiry && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultExpiryDays">Masa kadaluarsa (hari)</Label>
                    <Input
                      id="defaultExpiryDays"
                      type="number"
                      value={formData.defaultExpiryDays}
                      onChange={(e) => handleInputChange('defaultExpiryDays', e.target.value)}
                      placeholder="Contoh: 7 untuk seminggu"
                      min="1"
                      max="365"
                      required={formData.hasExpiry}
                    />
                    <p className="text-xs text-muted-foreground">
                      Produk akan kadaluarsa setelah {formData.defaultExpiryDays || 'X'} hari dari tanggal produksi
                    </p>
                  </div>

                  <ProductExpiryCalendar
                    hasExpiry={formData.hasExpiry}
                    expiryDate={formData.expiryDate}
                    onExpiryDateChange={(date) => handleInputChange('expiryDate', date)}
                    label="Tanggal Kadaluarsa (Opsional)"
                  />
                  
                  {formData.expiryDate && (
                    <p className="text-xs text-muted-foreground pl-0">
                      Jika tanggal kadaluarsa dipilih, akan digunakan sebagai contoh untuk batch produksi
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
