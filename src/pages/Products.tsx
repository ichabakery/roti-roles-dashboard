import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { AddProductDialog } from '@/components/products/AddProductDialog';
import { useProducts } from '@/hooks/useProducts';
import { Package } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Products = () => {
  const navigate = useNavigate();
  const { products, loading, error, refetchProducts } = useProducts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Produk</h2>
            <p className="text-muted-foreground">
              Kelola produk toko roti Anda
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/enhanced-products')}
              className="flex items-center gap-2"
            >
              Fitur Lengkap
              <ArrowRight className="h-4 w-4" />
            </Button>
            <AddProductDialog onProductAdded={refetchProducts} />
          </div>
        </div>

        <div>
          {loading ? (
            <div>Loading products...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <div className="mt-2">
                    Harga: Rp {product.price.toLocaleString()}
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
