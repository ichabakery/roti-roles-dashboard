import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCashierDashboard } from '@/hooks/useCashierDashboard';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  RotateCcw, 
  Warehouse, 
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package
} from 'lucide-react';

export const CashierDashboard = () => {
  const { kpis, topProducts, criticalStock, loading } = useCashierDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {kpis.todaySales.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todayTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKU ≤ ROP</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retur Hari Ini</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todayReturns}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/cashier')} className="bg-primary hover:bg-primary/90">
              <CreditCard className="mr-2 h-4 w-4" />
              Buka Kasir
            </Button>
            <Button variant="outline" onClick={() => navigate('/returns')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tambah Retur
            </Button>
            <Button variant="outline" onClick={() => navigate('/inventory')}>
              <Warehouse className="mr-2 h-4 w-4" />
              Lihat Stok Cabang
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Critical Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stok Kritis (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criticalStock.length > 0 ? (
              <div className="space-y-2">
                {criticalStock.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stok: {item.current_stock} | ROP: {item.reorder_point}
                      </p>
                    </div>
                    <Badge variant="destructive">Kritis</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada stok kritis</p>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Top 5 Terlaris Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-2">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{product.product_name}</span>
                    <Badge variant="secondary">{product.total_quantity} unit</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada data penjualan hari ini</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};