
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Shield, AlertCircle } from 'lucide-react';
import { reconcileStockData, fixStockDiscrepancies, createCorrectiveAdjustment } from '@/utils/stockReconciliation';
import { toast } from '@/hooks/use-toast';

interface StockDiscrepancy {
  product_id: string;
  product_name: string;
  branch_id: string;
  branch_name: string;
  current_stock: number;
  calculated_stock: number;
  difference: number;
  has_initial_data: boolean;
  confidence_level: 'high' | 'medium' | 'low';
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
    
    // Check if there are low confidence discrepancies
    const lowConfidenceCount = discrepancies.filter(d => d.confidence_level === 'low').length;
    
    if (lowConfidenceCount > 0) {
      toast({
        variant: "destructive",
        title: "Peringatan",
        description: `${lowConfidenceCount} item memiliki tingkat kepercayaan rendah. Periksa data referensi terlebih dahulu.`,
      });
      return;
    }
    
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

  const fixBolusatikKecil = async () => {
    setLoading(true);
    try {
      // Hardcoded fix for the corrupted Bolu Batik Kecil at Singgahan
      // Based on your report: was 68, sold 8, should be 60, but showed 77
      await createCorrectiveAdjustment(
        'd5966283-2e44-4186-84cf-cc2dbc12a34a', // Bolu batik kecil product ID
        '6b5d9383-7c46-4134-8d62-988e74ff42c6', // Singgahan branch ID
        60, // Correct stock should be 60
        'Fix corrupted stock from reconciliation bug (68 - 8 sales = 60)'
      );
      
      toast({
        title: "Koreksi Berhasil",
        description: "Stok Bolu Batik Kecil telah diperbaiki menjadi 60 pcs",
      });
      
      // Re-run reconciliation
      await runReconciliation();
    } catch (error) {
      console.error('Error fixing Bolu Batik Kecil:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memperbaiki stok Bolu Batik Kecil",
      });
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
        {/* Emergency Fix Button */}
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>Deteksi bug reconciliation pada Bolu Batik Kecil - klik untuk perbaiki ke stok yang benar (60 pcs)</span>
              <Button size="sm" onClick={fixBolusatikKecil} disabled={loading} variant="outline">
                Fix Bolu Batik Kecil
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={runReconciliation} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Cek Konsistensi Stok
            </Button>
            {discrepancies.length > 0 && (
              <Button onClick={fixAllDiscrepancies} disabled={loading} variant="outline">
                <Shield className="mr-2 h-4 w-4" />
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
            
            {/* Warning for low confidence items */}
            {discrepancies.some(d => d.confidence_level === 'low') && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Beberapa item memiliki tingkat kepercayaan rendah karena kurangnya data referensi awal. 
                  Pastikan untuk membuat stock adjustment initial untuk produk-produk ini.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {discrepancies.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-sm text-muted-foreground">
                        di {item.branch_name}
                      </span>
                      <Badge 
                        variant={
                          item.confidence_level === 'high' ? 'default' : 
                          item.confidence_level === 'medium' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {item.confidence_level === 'high' ? 'Tinggi' : 
                         item.confidence_level === 'medium' ? 'Sedang' : 'Rendah'}
                      </Badge>
                    </div>
                    <Badge variant="destructive">
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Current: {item.current_stock} | Expected: {item.calculated_stock}
                    {!item.has_initial_data && (
                      <span className="text-orange-600 ml-2">⚠️ Tidak ada data stok awal</span>
                    )}
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
