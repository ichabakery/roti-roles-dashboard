
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { useProductBatches } from '@/hooks/useProductBatches';

export const ExpiryMonitoring = () => {
  const { expiringProducts, fetchExpiring } = useProductBatches();

  useEffect(() => {
    fetchExpiring(7); // Check for next 7 days
  }, [fetchExpiring]);

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const getUrgencyBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysUntilExpiry === 0) {
      return <Badge variant="destructive">Expires Today</Badge>;
    } else if (daysUntilExpiry === 1) {
      return <Badge variant="destructive">Expires Tomorrow</Badge>;
    } else if (daysUntilExpiry <= 3) {
      return <Badge variant="secondary">Expires in {daysUntilExpiry} days</Badge>;
    } else {
      return <Badge variant="outline">Expires in {daysUntilExpiry} days</Badge>;
    }
  };

  const groupedProducts = expiringProducts.reduce((acc, product) => {
    const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date);
    
    if (daysUntilExpiry < 0) {
      acc.expired.push(product);
    } else if (daysUntilExpiry <= 1) {
      acc.critical.push(product);
    } else if (daysUntilExpiry <= 3) {
      acc.warning.push(product);
    } else {
      acc.normal.push(product);
    }
    
    return acc;
  }, { expired: [], critical: [], warning: [], normal: [] } as any);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{groupedProducts.expired.length}</p>
                <p className="text-sm text-red-800">Sudah Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{groupedProducts.critical.length}</p>
                <p className="text-sm text-orange-800">Kritis (0-1 hari)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{groupedProducts.warning.length}</p>
                <p className="text-sm text-yellow-800">Peringatan (2-3 hari)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detail Produk Akan Expired</CardTitle>
            <Button onClick={() => fetchExpiring(7)} variant="outline">
              Refresh Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expiringProducts.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedProducts).map(([category, products]) => {
                if (products.length === 0) return null;
                
                const categoryTitles = {
                  expired: 'Sudah Expired',
                  critical: 'Kritis (0-1 hari)',
                  warning: 'Peringatan (2-3 hari)',
                  normal: 'Normal (4-7 hari)'
                };

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-lg">{categoryTitles[category as keyof typeof categoryTitles]}</h4>
                    <div className="space-y-2">
                      {products.map((product: any, index: number) => {
                        const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date);
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.product_name}</span>
                                {getUrgencyBadge(daysUntilExpiry)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {product.branch_name} | Batch: {product.batch_number} | 
                                Qty: {product.quantity} | 
                                Expired: {new Date(product.expiry_date).toLocaleDateString('id-ID')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {daysUntilExpiry <= 1 && (
                                <Button variant="destructive" size="sm">
                                  Proses Return
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                Diskon Khusus
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak Ada Produk Akan Expired</h3>
              <p className="text-muted-foreground">
                Semua produk dalam kondisi baik untuk 7 hari ke depan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
