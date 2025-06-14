
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Archive, AlertTriangle } from 'lucide-react';
import { ProductType } from '@/types/products';
import { fetchProductsWithType } from '@/services/enhancedProductService';
import { useProductBatches } from '@/hooks/useProductBatches';
import { ProductTypeSelector } from '@/components/products/ProductTypeSelector';
import { ProductPackageManager } from '@/components/products/ProductPackageManager';
import { BatchManagement } from '@/components/products/BatchManagement';
import { ExpiryMonitoring } from '@/components/products/ExpiryMonitoring';

const EnhancedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductType, setSelectedProductType] = useState<ProductType>('regular');
  const { toast } = useToast();
  const { expiringProducts, fetchExpiring } = useProductBatches();

  useEffect(() => {
    fetchProducts();
    fetchExpiring(7); // Check expiring products for next 7 days
  }, [selectedProductType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProductsWithType(selectedProductType);
      setProducts(data);
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

  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'package': return <Package className="h-4 w-4" />;
      case 'bundle': return <Archive className="h-4 w-4" />;
      default: return null;
    }
  };

  const getProductTypeBadge = (type: ProductType) => {
    const colors = {
      regular: 'default',
      package: 'secondary',
      bundle: 'outline'
    } as const;

    return (
      <Badge variant={colors[type]} className="flex items-center gap-1">
        {getProductTypeIcon(type)}
        {type === 'regular' ? 'Reguler' : type === 'package' ? 'Paket' : 'Bundling'}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Produk Lengkap</h2>
            <p className="text-muted-foreground">
              Kelola produk reguler, paket, bundling, dan tracking expired
            </p>
          </div>
          
          {expiringProducts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">
                    {expiringProducts.length} produk akan expired dalam 7 hari!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="packages">Paket & Bundling</TabsTrigger>
            <TabsTrigger value="batches">Batch Management</TabsTrigger>
            <TabsTrigger value="expiry">Monitoring Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Produk</CardTitle>
                  <div className="flex items-center gap-4">
                    <ProductTypeSelector
                      selectedType={selectedProductType}
                      onTypeChange={setSelectedProductType}
                    />
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Produk
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            {getProductTypeBadge(product.product_type)}
                          </div>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                          <p className="font-bold text-green-600">Rp {product.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(product.product_type === 'package' || product.product_type === 'bundle') && (
                            <Button variant="outline" size="sm">
                              Kelola Komponen
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <ProductPackageManager />
          </TabsContent>

          <TabsContent value="batches">
            <BatchManagement />
          </TabsContent>

          <TabsContent value="expiry">
            <ExpiryMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EnhancedProducts;
