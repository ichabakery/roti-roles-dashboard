import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isInventoryV1Enabled } from '@/utils/featureFlags';

interface ConsistencyIssue {
  type: 'negative_stock' | 'duplicate_sku' | 'missing_uom';
  severity: 'critical' | 'warning';
  productId: string;
  productName: string;
  details: string;
  suggestion: string;
}

export const StockConsistencyChecker: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();

  const checkConsistency = async () => {
    if (!isInventoryV1Enabled()) return;
    
    setChecking(true);
    const foundIssues: ConsistencyIssue[] = [];

    try {
      // Check for negative stock
      const { data: negativeStock, error: negativeError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product_id,
          products!fk_inventory_product_id (
            id,
            name
          )
        `)
        .lt('quantity', 0);

      if (negativeError) throw negativeError;

      negativeStock?.forEach((item: any) => {
        foundIssues.push({
          type: 'negative_stock',
          severity: 'critical',
          productId: item.product_id,
          productName: item.products?.name || 'Unknown Product',
          details: `Stok negatif: ${item.quantity}`,
          suggestion: 'Lakukan penyesuaian stok untuk memperbaiki nilai negatif'
        });
      });

      // Check for duplicate SKUs (non-null)
      const { data: duplicateSKUs, error: skuError } = await supabase
        .from('products')
        .select('id, name, sku')
        .not('sku', 'is', null);

      if (skuError) throw skuError;

      const skuGroups = duplicateSKUs?.reduce((acc, product) => {
        if (!acc[product.sku]) {
          acc[product.sku] = [];
        }
        acc[product.sku].push(product);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(skuGroups || {}).forEach(([sku, products]) => {
        if (products.length > 1) {
          products.forEach((product) => {
            foundIssues.push({
              type: 'duplicate_sku',
              severity: 'critical',
              productId: product.id,
              productName: product.name,
              details: `SKU duplikat: ${sku}`,
              suggestion: 'Ubah SKU menjadi unik atau kosongkan untuk auto-generate'
            });
          });
        }
      });

      // Check for missing UoM (informational only)
      const { data: missingUoM, error: uomError } = await supabase
        .from('products')
        .select('id, name, uom')
        .is('uom', null)
        .eq('active', true);

      if (uomError) throw uomError;

      missingUoM?.forEach((product) => {
        foundIssues.push({
          type: 'missing_uom',
          severity: 'warning',
          productId: product.id,
          productName: product.name,
          details: 'UoM tidak diset (akan tampil sebagai "pcs")',
          suggestion: 'Set UoM yang sesuai untuk produk ini'
        });
      });

      setIssues(foundIssues);
      setLastChecked(new Date());

      toast({
        title: "Pemeriksaan Selesai",
        description: `Ditemukan ${foundIssues.length} masalah konsistensi`,
        variant: foundIssues.some(i => i.severity === 'critical') ? "destructive" : "default"
      });

    } catch (error: any) {
      console.error('Error checking consistency:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memeriksa konsistensi: ${error.message}`,
      });
    } finally {
      setChecking(false);
    }
  };

  const getSeverityColor = (severity: 'critical' | 'warning') => {
    return severity === 'critical' ? 'destructive' : 'secondary';
  };

  const getSeverityIcon = (severity: 'critical' | 'warning') => {
    return severity === 'critical' ? AlertTriangle : Shield;
  };

  if (!isInventoryV1Enabled()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Konsistensi Stok</span>
            </CardTitle>
            <CardDescription>
              Periksa dan validasi konsistensi data inventori
            </CardDescription>
          </div>
          <Button 
            onClick={checkConsistency} 
            disabled={checking}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Memeriksa...' : 'Cek Konsistensi'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lastChecked && (
          <p className="text-sm text-muted-foreground">
            Terakhir diperiksa: {lastChecked.toLocaleString('id-ID')}
          </p>
        )}

        {issues.length === 0 && lastChecked && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada masalah konsistensi yang ditemukan. Inventori dalam kondisi baik.
            </AlertDescription>
          </Alert>
        )}

        {issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">
              Ditemukan {issues.length} masalah:
            </h4>
            {issues.map((issue, index) => {
              const Icon = getSeverityIcon(issue.severity);
              return (
                <Alert key={index} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                  <Icon className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{issue.productName}</span>
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity === 'critical' ? 'Kritis' : 'Peringatan'}
                        </Badge>
                      </div>
                      <p className="text-sm">{issue.details}</p>
                      <p className="text-xs text-muted-foreground">
                        💡 {issue.suggestion}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};