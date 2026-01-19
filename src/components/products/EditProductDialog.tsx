
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Package, ChevronDown, AlertTriangle } from 'lucide-react';
import { ProductType, Product } from '@/types/products';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';
import { isInventoryV1Enabled, INVENTORY_DEFAULTS } from '@/utils/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_CATEGORY_VALUE } from '@/constants/productCategories';
import { useCategories } from '@/hooks/useCategories';
import { checkDuplicateProductName, DuplicateCheckResult } from '@/services/productValidationService';

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
  const [inventorySectionOpen, setInventorySectionOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: DEFAULT_CATEGORY_VALUE,
    productType: 'regular' as ProductType,
    hasExpiry: false,
    defaultExpiryDays: '',
    // Inventory V1 fields
    sku: '',
    uom: 'pcs',
    reorderPoint: '',
    leadTimeDays: '',
    shelfLifeDays: '',
  });
  const { toast } = useToast();
  const { changeProductType } = useEnhancedProducts();
  const { categories } = useCategories();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        category: (product as any).category || DEFAULT_CATEGORY_VALUE,
        productType: product.product_type,
        hasExpiry: product.has_expiry || false,
        defaultExpiryDays: product.default_expiry_days?.toString() || '',
        // Inventory V1 fields
        sku: product.sku || '',
        uom: product.uom || INVENTORY_DEFAULTS.UOM,
        reorderPoint: product.reorder_point?.toString() || INVENTORY_DEFAULTS.REORDER_POINT.toString(),
        leadTimeDays: product.lead_time_days?.toString() || INVENTORY_DEFAULTS.LEAD_TIME_DAYS.toString(),
        shelfLifeDays: product.shelf_life_days?.toString() || '',
      });
      setDuplicateWarning(null);
    }
  }, [product]);

  const handleNameBlur = async () => {
    if (!formData.name.trim() || !product) {
      setDuplicateWarning(null);
      return;
    }
    
    // Only check if name changed
    if (formData.name.trim().toLowerCase() === product.name.toLowerCase()) {
      setDuplicateWarning(null);
      return;
    }
    
    try {
      const result = await checkDuplicateProductName(formData.name, product.id);
      setDuplicateWarning(result);
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);

    try {
      // Check for duplicate name if changed
      if (formData.name.trim().toLowerCase() !== product.name.toLowerCase()) {
        const duplicateCheck = await checkDuplicateProductName(formData.name, product.id);
        if (duplicateCheck.isDuplicate) {
          toast({
            variant: "destructive",
            title: "Produk sudah ada",
            description: `Produk dengan nama "${duplicateCheck.existingProduct?.name}" sudah terdaftar. Silakan gunakan nama lain.`,
          });
          setLoading(false);
          return;
        }
      }

      // Update basic product info
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        has_expiry: formData.hasExpiry,
        default_expiry_days: formData.hasExpiry && formData.defaultExpiryDays 
          ? parseInt(formData.defaultExpiryDays) 
          : null,
        // Simple Inventory V1 fields (only if feature is enabled)
        ...(isInventoryV1Enabled() && {
          sku: formData.sku || null,
          uom: formData.uom || INVENTORY_DEFAULTS.UOM,
          reorder_point: formData.reorderPoint ? parseInt(formData.reorderPoint) : null,
          lead_time_days: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
          shelf_life_days: formData.hasExpiry && formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : null,
        }),
      };

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (updateError) {
        throw updateError;
      }

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

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear duplicate warning when name changes
    if (field === 'name') {
      setDuplicateWarning(null);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[90dvh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-3">
          <DialogTitle>Edit Produk</DialogTitle>
        </div>
        
        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-4 px-6 pb-24">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Produk</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Masukkan nama produk"
              required
              className={duplicateWarning?.isDuplicate ? 'border-destructive' : ''}
            />
            {duplicateWarning?.isDuplicate && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Produk dengan nama "{duplicateWarning.existingProduct?.name}" sudah ada. 
                  {!duplicateWarning.existingProduct?.active && ' (Nonaktif)'}
                </AlertDescription>
              </Alert>
            )}
            {!duplicateWarning?.isDuplicate && duplicateWarning?.similarProducts && duplicateWarning.similarProducts.length > 0 && (
              <Alert className="py-2 border-amber-500 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Produk dengan nama mirip: {duplicateWarning.similarProducts.map(p => p.name).join(', ')}
                </AlertDescription>
              </Alert>
            )}
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
            <Label htmlFor="edit-category">Kategori</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-hasExpiry"
                checked={formData.hasExpiry}
                onCheckedChange={(checked) => handleInputChange('hasExpiry', checked as boolean)}
              />
              <Label htmlFor="edit-hasExpiry" className="text-sm font-medium">
                Produk ini memiliki tanggal kadaluarsa
              </Label>
            </div>
            
            {formData.hasExpiry && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="edit-defaultExpiryDays">Masa kadaluarsa (hari)</Label>
                <Input
                  id="edit-defaultExpiryDays"
                  type="number"
                  value={formData.defaultExpiryDays}
                  onChange={(e) => handleInputChange('defaultExpiryDays', e.target.value)}
                  placeholder="Contoh: 7 untuk seminggu"
                  min="1"
                  max="365"
                />
              </div>
            )}
          </div>

          {/* Simple Inventory V1 Section */}
          {isInventoryV1Enabled() && (
            <Collapsible open={inventorySectionOpen} onOpenChange={setInventorySectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 font-medium">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Inventori (Ringkas)</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${inventorySectionOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU</Label>
                    <Input
                      id="edit-sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="SKU produk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-uom">Satuan (UoM)</Label>
                    <Select value={formData.uom} onValueChange={(value) => handleInputChange('uom', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="pak">Pak</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="ltr">Liter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-reorderPoint">Reorder Point (ROP)</Label>
                    <Input
                      id="edit-reorderPoint"
                      type="number"
                      value={formData.reorderPoint}
                      onChange={(e) => handleInputChange('reorderPoint', e.target.value)}
                      placeholder="30"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Batas stok menipis
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-leadTimeDays">Lead Time (hari)</Label>
                    <Input
                      id="edit-leadTimeDays"
                      type="number"
                      value={formData.leadTimeDays}
                      onChange={(e) => handleInputChange('leadTimeDays', e.target.value)}
                      placeholder="2"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Estimasi hari restok
                    </p>
                  </div>
                </div>

                {formData.hasExpiry && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-shelfLifeDays">Shelf Life (hari)</Label>
                    <Input
                      id="edit-shelfLifeDays"
                      type="number"
                      value={formData.shelfLifeDays}
                      onChange={(e) => handleInputChange('shelfLifeDays', e.target.value)}
                      placeholder="3"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Umur simpan untuk peringatan kadaluarsa sederhana
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </form>
        
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" form="edit-product-form" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
