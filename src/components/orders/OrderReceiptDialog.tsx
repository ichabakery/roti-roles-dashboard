import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Receipt, Phone, Printer, Download } from 'lucide-react';
import { OrderReceiptWhatsApp } from './OrderReceiptWhatsApp';
import { OrderReceiptPrinter } from './OrderReceiptPrinter';
import type { Order } from '@/services/orderService';

interface OrderReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderReceiptDialog: React.FC<OrderReceiptDialogProps> = ({
  open,
  onClose,
  order
}) => {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Dikonfirmasi';
      case 'in_production': return 'Sedang Diproduksi';
      case 'ready': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'cash_on_delivery': return 'Bayar saat ambil';
      case 'dp': return 'DP (Uang Muka)';
      case 'full_payment': return 'Lunas';
      default: return paymentType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bukti Pemesanan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <Card>
            <CardContent className="p-4 text-center">
              <h2 className="text-lg font-bold">Toko Roti Makmur</h2>
              <p className="text-sm text-muted-foreground">{order.branch_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>

          {/* Order Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">No. Pesanan:</span>
              <span className="text-sm font-mono">{order.order_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tanggal Pesan:</span>
              <span className="text-sm">{new Date(order.order_date).toLocaleDateString('id-ID')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tanggal Ambil:</span>
              <span className="text-sm">{new Date(order.delivery_date).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Informasi Pelanggan</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Nama:</span>
                <span className="text-sm font-medium">{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-sm">Telepon:</span>
                  <span className="text-sm">{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Detail Pesanan</h3>
            <div className="space-y-2">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="font-medium">
                    Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-bold">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Metode Bayar:</span>
              <span className="text-sm">{getPaymentTypeLabel(order.payment_type || 'cash_on_delivery')}</span>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium">Catatan:</span>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <OrderReceiptWhatsApp order={order} />
            <OrderReceiptPrinter order={order} />
            <Button variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Terima kasih atas pesanan Anda!</p>
            <p>Mohon simpan bukti ini untuk pengambilan pesanan.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};