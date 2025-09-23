
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  last_updated: string;
  product: Product;
  branch: Branch;
}

interface InventoryStatsProps {
  inventory: InventoryItem[];
  loading: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({
  inventory,
  loading
}) => {
  const totalProducts = inventory.length;
  const outOfStock = inventory.filter(item => item.quantity === 0).length;
  const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity < 10).length;
  const inStock = inventory.filter(item => item.quantity >= 10).length;

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Total Produk
          </CardTitle>
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalProducts}</div>
        </CardContent>
      </Card>
      
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Stok Tersedia
          </CardTitle>
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{inStock}</div>
        </CardContent>
      </Card>
      
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Stok Menipis
          </CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{lowStock}</div>
        </CardContent>
      </Card>
      
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">
            Stok Habis
          </CardTitle>
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{outOfStock}</div>
        </CardContent>
      </Card>
    </div>
  );
};
