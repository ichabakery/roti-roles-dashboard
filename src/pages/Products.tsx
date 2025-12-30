
import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { ProductExpiryBadge } from '@/components/products/ProductExpiryBadge';
import { useProducts } from '@/hooks/useProducts';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '@/constants/productCategories';

const Products = () => {
  const navigate = useNavigate();
  const { products, loading, error, refetchProducts } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return products;
    }
    return products.filter(p => (p as any).category === selectedCategory);
  }, [products, selectedCategory]);

  // Get unique categories that have products
  const availableCategories = useMemo(() => {
    const categoriesWithProducts = new Set(products.map(p => (p as any).category || 'produk_utama'));
    return PRODUCT_CATEGORIES.filter(cat => categoriesWithProducts.has(cat.value));
  }, [products]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts };
    }
    
    const groups: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach(product => {
      const cat = (product as any).category || 'produk_utama';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(product);
    });
    
    // Sort by category order
    const orderedGroups: Record<string, typeof filteredProducts> = {};
    PRODUCT_CATEGORIES.forEach(cat => {
      if (groups[cat.value]) {
        orderedGroups[cat.value] = groups[cat.value];
      }
    });
    
    return orderedGroups;
  }, [filteredProducts, selectedCategory]);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Produk</h2>
            <p className="text-sm text-muted-foreground">
              Kelola produk toko roti Anda
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/enhanced-products')}
              className="flex items-center gap-2 flex-1 sm:flex-initial text-sm"
              size="sm"
            >
              Fitur Lengkap
              <ArrowRight className="h-4 w-4" />
            </Button>
            <AddProductDialog onProductAdded={refetchProducts} />
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Memuat produk...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Error memuat produk</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={refetchProducts} className="mt-4">
                  Coba Lagi
                </Button>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Belum ada produk</h3>
                <p className="text-muted-foreground">Tambahkan produk pertama Anda</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    Semua
                  </TabsTrigger>
                  {availableCategories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Products grouped by category */}
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category} className="space-y-3">
                  {selectedCategory === 'all' && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      {getCategoryLabel(category)}
                    </h3>
                  )}
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold line-clamp-2">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-lg font-bold text-primary">
                            Rp {product.price.toLocaleString('id-ID')}
                          </div>
                          
                          <ProductExpiryBadge 
                            hasExpiry={product.has_expiry} 
                            defaultExpiryDays={product.default_expiry_days} 
                          />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Dibuat: {new Date(product.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;
