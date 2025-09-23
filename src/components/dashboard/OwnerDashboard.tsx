import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOwnerDashboard } from '@/hooks/useOwnerDashboard';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock,
  BarChart3,
  ArrowUpDown,
  Calendar
} from 'lucide-react';

export const OwnerDashboard = () => {
  const { kpis, topProducts, expiringProducts, loading } = useOwnerDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini (All)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {kpis.todaySalesAll.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Estimasi</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {kpis.todayMarginAll.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Opsional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKU ≤ ROP (All)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.lowStockCountAll}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kadaluarsa ≤ 3 Hari</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.expiringCount}</div>
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
            <Button onClick={() => navigate('/products')}>
              <Package className="mr-2 h-4 w-4" />
              Kelola Produk
            </Button>
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Laporan
            </Button>
            <Button variant="outline" onClick={() => navigate('/inventory')}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Transfer Stok
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Expiring Products Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Produk Kadaluarsa ≤ 3 Hari (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringProducts.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {expiringProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.branch_name} • {item.quantity} unit
                      </p>
                    </div>
                    <Badge variant={item.days_until_expiry <= 1 ? "destructive" : "secondary"}>
                      {item.days_until_expiry}h
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada produk kadaluarsa</p>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top 5 SKU Terlaris (7 Hari)
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
              <p className="text-muted-foreground">Belum ada data penjualan</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};