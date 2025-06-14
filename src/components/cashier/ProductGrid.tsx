
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <Card 
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="p-4 pb-0">
            <div className="text-4xl mb-2 flex justify-center">
              {product.name.includes('Roti') ? '🍞' : 
               product.name.includes('Donat') ? '🍩' : 
               product.name.includes('Coklat') ? '🍫' : 
               product.name.includes('Kue') ? '🍰' : '🧁'}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
            <p className="text-sm font-bold mt-1">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
