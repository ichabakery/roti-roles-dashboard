
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock?: number;
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
      {products.map(product => {
        const stock = product.stock ?? undefined;
        let stockBadge = null;
        if (typeof stock === 'number') {
          stockBadge = (
            <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium
              ${stock === 0 ? 'bg-red-600 text-white' :
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
            <CardHeader className="p-4 pb-0">
              <div className="text-4xl mb-2 flex justify-center">
                {product.name.includes('Roti') ? '🍞' : 
                 product.name.includes('Donat') ? '🍩' : 
                 product.name.includes('Coklat') ? '🍫' : 
                 product.name.includes('Kue') ? '🍰' : '🧁'}
              </div>
              {stockBadge}
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
              <p className="text-sm font-bold mt-1">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
