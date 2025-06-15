
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Package, AlertCircle } from 'lucide-react';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';
import { useProductPackages } from '@/hooks/useProductPackages';
import { EnhancedAddProductDialog } from './EnhancedAddProductDialog';

export const ProductPackageManager = () => {
  const [selectedParentProduct, setSelectedParentProduct] = useState<string>('');
  const [newComponent, setNewComponent] = useState({ productId: '', quantity: 1 });
  const { products, refetchProducts } = useEnhancedProducts();
  const { packages, addPackageComponent, removeComponent, fetchPackages } = useProductPackages(selectedParentProduct);

  const packageProducts = products.filter(p => p.active && (p.product_type === 'package' || p.product_type === 'bundle'));
  const componentProducts = products.filter(p => p.active && p.product_type === 'regular');

  React.useEffect(() => {
    if (selectedParentProduct) {
      fetchPackages();
    }
  }, [selectedParentProduct, fetchPackages]);

  const handleAddComponent = async () => {
    if (!newComponent.productId || !selectedParentProduct) return;
    
    const success = await addPackageComponent([{
      productId: newComponent.productId,
      quantity: newComponent.quantity
    }]);
    
    if (success) {
      setNewComponent({ productId: '', quantity: 1 });
    }
  };

  const handleProductAdded = () => {
    refetchProducts();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Kelola Paket & Bundling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {packageProducts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Belum Ada Produk Paket atau Bundling</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Untuk mulai mengelola paket dan bundling, Anda perlu membuat produk dengan jenis "Paket" atau "Bundling" terlebih dahulu.
                </p>
              </div>
              <EnhancedAddProductDialog onProductAdded={handleProductAdded} />
            </div>
          ) : (
            <div className="grid gap-4">
              <div>
                <Label htmlFor="parent-product">Pilih Produk Paket/Bundling</Label>
                <Select value={selectedParentProduct} onValueChange={setSelectedParentProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk paket atau bundling" />
                  </SelectTrigger>
                  <SelectContent>
                    {packageProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.product_type === 'package' ? 'Paket' : 'Bundling'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedParentProduct && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold">Komponen Produk</h4>
                  
                  {packages.length > 0 ? (
                    <div className="space-y-2">
                      {packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <span className="font-medium">{pkg.component_product?.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              x{pkg.quantity}
                            </span>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeComponent(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-muted-foreground">Belum ada komponen dalam paket ini</p>
                      <p className="text-sm text-muted-foreground">
                        Tambahkan produk reguler sebagai komponen paket/bundling di bawah ini
                      </p>
                    </div>
                  )}

                  {componentProducts.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center space-y-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Belum ada produk reguler yang bisa dijadikan komponen
                      </p>
                      <EnhancedAddProductDialog onProductAdded={handleProductAdded} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor="component-product">Produk Komponen</Label>
                        <Select 
                          value={newComponent.productId} 
                          onValueChange={(value) => setNewComponent(prev => ({ ...prev, productId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih produk" />
                          </SelectTrigger>
                          <SelectContent>
                            {componentProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="quantity">Jumlah</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newComponent.quantity}
                          onChange={(e) => setNewComponent(prev => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))}
                        />
                      </div>
                      
                      <Button onClick={handleAddComponent} disabled={!newComponent.productId}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
