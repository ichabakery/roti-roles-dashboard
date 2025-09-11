
import React from 'react';
import { PlusCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock?: number;
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  searchQuery,
  onAddToCart
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 border rounded-md">
        <div className="text-center text-muted-foreground">
          {searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk yang tersedia'}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded shadow-sm">
        <thead>
          <tr className="bg-muted">
            <th className="py-2 px-4 text-left">Produk</th>
            <th className="py-2 px-4 text-left">Harga</th>
            <th className="py-2 px-4 text-center">Stok</th>
            <th className="py-2 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const stock = product.stock ?? 0;
            const stockColor =
              stock === 0 ? 'text-red-600' :
                stock < 10 ? 'text-yellow-600' :
                  'text-green-700';
            const stockBg =
              stock === 0 ? 'bg-red-50' :
                stock < 10 ? 'bg-yellow-50' :
                  'bg-green-50';
            return (
              <tr key={product.id} className="border-b last:border-b-0">
                <td className="py-2 px-4">
                  <span className="font-semibold">{product.name}</span>
                  <div className="text-xs text-muted-foreground">{product.description}</div>
                </td>
                <td className="py-2 px-4 font-bold">
                  Rp {product.price.toLocaleString('id-ID')}
                </td>
                <td className={`py-2 px-4 text-center ${stockColor}`}>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${stockBg}`}>
                    {stock === 0 ? 'Habis' : stock < 10 ? `Menipis (${stock})` : stock}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                    title={stock === 0 ? "Tambah ke Keranjang (Stok Habis)" : "Tambah ke Keranjang"}
                    onClick={() => onAddToCart(product)}
                  >
                    <PlusCircle size={18} /> Tambah
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};
