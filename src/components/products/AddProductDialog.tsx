
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddProductDialogProps {
  onProductAdded: () => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({ onProductAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    hasExpiry: false,
    defaultExpiryDays: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        active: true,
        has_expiry: formData.hasExpiry,
        default_expiry_days: formData.hasExpiry && formData.defaultExpiryDays 
          ? parseInt(formData.defaultExpiryDays) 
          : null,
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        throw error;
      }

      toast({
        title: "Berhasil",
        description: `Produk berhasil ditambahkan${formData.hasExpiry ? ' dengan monitoring kadaluarsa' : ''}`,
      });

      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        hasExpiry: false, 
        defaultExpiryDays: '' 
      });
      setOpen(false);
      onProductAdded();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
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
              <div className="space-y-2 pl-6">
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
            )}
          </div>
          
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
