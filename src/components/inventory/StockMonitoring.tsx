
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { reconcileStockData, fixStockDiscrepancies } from '@/utils/stockReconciliation';
import { toast } from '@/hooks/use-toast';

interface StockDiscrepancy {
  product_id: string;
  product_name: string;
  branch_id: string;
  branch_name: string;
  current_stock: number;
  calculated_stock: number;
  difference: number;
}

export const StockMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [discrepancies, setDiscrepancies] = useState<StockDiscrepancy[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runReconciliation = async () => {
    setLoading(true);
    try {
      console.log('🔄 Running stock reconciliation...');
      const results = await reconcileStockData();
      setDiscrepancies(results);
      setLastCheck(new Date());
      
      toast({
        title: "Reconciliation Selesai",
        description: `Ditemukan ${results.length} discrepancy`,
      });
    } catch (error) {
      console.error('Error running reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixAllDiscrepancies = async () => {
    if (discrepancies.length === 0) return;
    
    setLoading(true);
    try {
      const success = await fixStockDiscrepancies(discrepancies);
      if (success) {
        setDiscrepancies([]);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Error fixing discrepancies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run initial check
    runReconciliation();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Monitoring Stok
        </CardTitle>
        <CardDescription>
          Sistem monitoring untuk memastikan konsistensi data stok
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={runReconciliation} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Cek Konsistensi Stok
            </Button>
            {discrepancies.length > 0 && (
              <Button onClick={fixAllDiscrepancies} disabled={loading} variant="outline">
                Perbaiki Semua
              </Button>
            )}
          </div>
          
          {lastCheck && (
            <span className="text-sm text-muted-foreground">
              Terakhir dicek: {lastCheck.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status Sistem</span>
                {discrepancies.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="mt-2">
                <Badge variant={discrepancies.length === 0 ? "default" : "destructive"}>
                  {discrepancies.length === 0 ? "Stok Konsisten" : `${discrepancies.length} Discrepancy`}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm font-medium">Database Trigger</div>
              <div className="mt-2">
                <Badge variant="default">Aktif</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-update stok saat transaksi
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm font-medium">Real-time Sync</div>
              <div className="mt-2">
                <Badge variant="default">Aktif</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sinkronisasi antar cabang
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Discrepancies List */}
        {discrepancies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Discrepancy Terdeteksi:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {discrepancies.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        di {item.branch_name}
                      </span>
                    </div>
                    <Badge variant="destructive">
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Current: {item.current_stock} | Expected: {item.calculated_stock}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
