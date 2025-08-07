import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Package, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orderService } from '@/services/orderService';

interface ZeroStockItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  unitPrice: number;
}

interface ZeroStockOrderFlowProps {
  open: boolean;
  onClose: () => void;
  zeroStockItems: ZeroStockItem[];
  onProceedWithOrder: (items: ZeroStockItem[], createProductionRequests: boolean) => void;
  branchId: string;
}

export const ZeroStockOrderFlow: React.FC<ZeroStockOrderFlowProps> = ({
  open,
  onClose,
  zeroStockItems,
  onProceedWithOrder,
  branchId
}) => {
  const [createProductionRequests, setCreateProductionRequests] = useState(true);
  const [customerNotified, setCustomerNotified] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleProceed = () => {
    if (!customerNotified) {
      toast({
        title: "Konfirmasi diperlukan",
        description: "Pastikan pelanggan telah diberitahu tentang ketersediaan stok",
        variant: "destructive"
      });
      return;
    }

    onProceedWithOrder(zeroStockItems, createProductionRequests);
    onClose();
  };

  const totalOutOfStock = zeroStockItems.filter(item => item.availableStock === 0).length;
  const totalLowStock = zeroStockItems.filter(item => item.availableStock > 0 && item.availableStock < item.requestedQuantity).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Peringatan Stok Tidak Mencukupi
          </DialogTitle>
          <DialogDescription>
            Beberapa item dalam pesanan ini memiliki stok yang tidak mencukupi atau habis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Status Summary */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {totalOutOfStock > 0 && (
                  <p><strong>{totalOutOfStock}</strong> item habis stok</p>
                )}
                {totalLowStock > 0 && (
                  <p><strong>{totalLowStock}</strong> item stok tidak mencukupi</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Detail Item Bermasalah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zeroStockItems.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Diminta: {item.requestedQuantity} | Tersedia: {item.availableStock}
                      </p>
                    </div>
                    <Badge variant={item.availableStock === 0 ? 'destructive' : 'secondary'}>
                      {item.availableStock === 0 ? 'Habis Stok' : 'Stok Kurang'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Production Request Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Permintaan Produksi Otomatis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="createProductionRequests"
                  checked={createProductionRequests}
                  onCheckedChange={(checked) => setCreateProductionRequests(checked === true)}
                />
                <label htmlFor="createProductionRequests" className="text-sm font-medium">
                  Buat permintaan produksi otomatis untuk item yang kurang/habis stok
                </label>
              </div>
              
              {createProductionRequests && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sistem akan secara otomatis membuat permintaan produksi untuk semua item yang diperlukan.
                    Tim produksi akan mendapat notifikasi untuk memproses pesanan ini.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Customer Notification */}
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="customerNotified"
                  checked={customerNotified}
                  onCheckedChange={(checked) => setCustomerNotified(checked === true)}
                />
                <label htmlFor="customerNotified" className="text-sm font-medium">
                  Saya telah memberitahu pelanggan tentang ketersediaan stok dan estimasi waktu
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan untuk pesanan (opsional)</label>
                <Textarea
                  placeholder="Tambahkan catatan khusus untuk pesanan ini..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              onClick={handleProceed}
              disabled={!customerNotified}
              className="flex-1"
            >
              Lanjutkan Pesanan
            </Button>
          </div>

          {/* Information */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Catatan:</strong> Pesanan akan dibuat dengan status "Menunggu Produksi" bila ada item perlu diproduksi (status sistem: in_production). Sistem otomatis membuat permintaan produksi untuk item yang kurang/habis.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};