
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

const Products = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Produk</h2>
            <p className="text-muted-foreground">
              Kelola data master produk toko roti
            </p>
          </div>
          
          <Button>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </div>

        <div className="flex items-center justify-center h-64 border rounded-md">
          <div className="text-center p-6">
            <ShoppingBag className="h-10 w-10 mx-auto mb-4 text-primary/60" />
            <h3 className="text-lg font-medium">Halaman Produk</h3>
            <p className="text-muted-foreground mt-1">
              (Placeholder) Implementasi lengkap produk akan ditambahkan setelah sistem role berjalan dengan baik
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Products;
