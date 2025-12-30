
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart } from 'lucide-react';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '@/constants/productCategories';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock?: number;
  category?: string | null;
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  searchQuery,
  onAddToCart
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Group and filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return products;
    }
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Get unique categories that have products
  const availableCategories = useMemo(() => {
    const categoriesWithProducts = new Set(products.map(p => p.category || 'produk_utama'));
    return PRODUCT_CATEGORIES.filter(cat => categoriesWithProducts.has(cat.value));
  }, [products]);

  // Group products by category for display
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredProducts };
    }
    
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      const cat = product.category || 'produk_utama';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(product);
    });
    
    // Sort by category order
    const orderedGroups: Record<string, Product[]> = {};
    PRODUCT_CATEGORIES.forEach(cat => {
      if (groups[cat.value]) {
        orderedGroups[cat.value] = groups[cat.value];
      }
    });
    
    return orderedGroups;
  }, [filteredProducts, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-4 flex items-center justify-center h-64 border rounded-md">
        <div className="text-center">
          <ShoppingCart className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk yang tersedia'}
          </p>
        </div>
      </div>
    );
  }

  return (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryProducts.map(product => {
              const stock = product.stock ?? undefined;
              let stockBadge = null;
              if (typeof stock === 'number') {
                stockBadge = (
                  <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium
                    ${stock === 0 ? 'bg-destructive text-destructive-foreground' :
                      stock < 10 ? 'bg-yellow-400 text-gray-900' :
                        'bg-green-600 text-white'}`}
                    title={stock === 0 ? 'Stok habis' : stock < 10 ? 'Stok menipis' : 'Stok tersedia'}
                  >
                    {stock === 0 ? 'Habis' : stock < 10 ? `Tersisa ${stock}` : `Stok ${stock}`}
                  </span>
                );
              }
              return (
                <Card 
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className={`relative cursor-pointer hover:shadow-md transition-shadow ${product.stock === 0 ? 'opacity-75 border-orange-200' : ''}`}
                  title={product.stock === 0 ? "Stok habis - Akan dibuat permintaan produksi" : "Tambah ke keranjang"}
                >
                  <CardHeader className="p-4 pb-2">
                    {stockBadge}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardTitle className="text-sm font-medium line-clamp-2">{product.name}</CardTitle>
                    <p className="text-sm font-bold mt-1 text-primary">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
