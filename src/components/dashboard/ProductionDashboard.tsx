import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductionDashboard } from '@/hooks/useProductionDashboard';
import { useNavigate } from 'react-router-dom';
import { 
  Factory, 
  AlertTriangle, 
  CheckCircle, 
  Trash2,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';

export const ProductionDashboard = () => {
  const { kpis, productionPlans, expiringBatches, loading } = useProductionDashboard();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permintaan Produksi</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todayRequests}</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKU Menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.lowStockForTomorrow}</div>
            <p className="text-xs text-muted-foreground">Untuk besok</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.completedBatches}</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wastage</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todayWastage}</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
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
            <Button onClick={() => navigate('/production')} className="bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              Buat Rencana Produksi Hari Ini
            </Button>
            <Button variant="outline" onClick={() => navigate('/production')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Input Batch Selesai
            </Button>
            <Button variant="outline" onClick={() => navigate('/production')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Catat Wastage
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Expiring Batches Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Batch Kadaluarsa ≤ 1 Hari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringBatches.length > 0 ? (
              <div className="space-y-2">
                {expiringBatches.map((batch, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{batch.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Batch: {batch.batch_number} • {batch.quantity} unit
                      </p>
                    </div>
                    <Badge variant="destructive">Kadaluarsa</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada batch kadaluarsa</p>
            )}
          </CardContent>
        </Card>

        {/* Production Plan vs Realization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Rencana vs Realisasi Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productionPlans.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {productionPlans.map((plan, index) => (
                  <div key={index} className="py-2 border-b last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{plan.product_name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {plan.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Rencana:</span> {plan.planned}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Realisasi:</span> {plan.realized}
                        </p>
                        <Badge variant={plan.difference >= 0 ? "default" : "destructive"} className="text-xs">
                          {plan.difference >= 0 ? '+' : ''}{plan.difference}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada rencana produksi hari ini</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};