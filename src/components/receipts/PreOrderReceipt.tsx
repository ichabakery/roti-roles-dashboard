import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PreOrderBadge } from '@/components/orders/PreOrderBadge';
import { Clock, MapPin, Phone, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PreOrderReceiptProps {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    order_date: string;
    delivery_date: string;
    total_amount: number;
    payment_type: string;
    payment_status: string;
    dp_amount?: number;
    remaining_amount?: number;
    branch_name?: string;
    pickup_branch_id?: string;
    is_preorder: boolean;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      availableStock?: number;
    }>;
  };
  branchName?: string;
}

export function PreOrderReceipt({ order, branchName }: PreOrderReceiptProps) {
  const getPaymentStatusLabel = (status: string, type: string) => {
    switch (status) {
      case 'paid':
        return 'Lunas';
      case 'partial':
        return 'DP';
      case 'pending':
        if (type === 'cash_on_delivery') return 'Bayar saat ambil';
        if (type === 'dp') return 'Belum DP';
        return 'Belum dibayar';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-xl">Bukti Pemesanan</CardTitle>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="font-mono">
            {order.order_number}
          </Badge>
          <PreOrderBadge isPreOrder={order.is_preorder} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{order.customer_phone}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Order Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Cabang: {branchName || order.branch_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Tanggal Ambil: {format(new Date(order.delivery_date), 'EEEE, dd MMMM yyyy', { locale: id })}
            </span>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Rincian Item
          </h4>
          {order.items.map((item, index) => {
            const fromStock = Math.min(item.quantity, item.availableStock || 0);
            const toProduce = Math.max(0, item.quantity - (item.availableStock || 0));
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} x Rp {item.unitPrice.toLocaleString()}
                    </div>
                    {order.is_preorder && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fromStock > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Stok: {fromStock}
                          </Badge>
                        )}
                        {toProduce > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Produksi: {toProduce}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      Rp {(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Payment Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold text-lg">
              Rp {order.total_amount.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Status Pembayaran:</span>
            <Badge className={getPaymentStatusColor(order.payment_status)}>
              {getPaymentStatusLabel(order.payment_status, order.payment_type)}
            </Badge>
          </div>

          {order.payment_status === 'partial' && order.dp_amount && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span>DP Dibayar:</span>
                <span>Rp {order.dp_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Sisa Pembayaran:</span>
                <span>Rp {(order.remaining_amount || 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {order.is_preorder && (
          <>
            <Separator />
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <div className="font-medium mb-1">Informasi Pre-Order</div>
                  <p>
                    Beberapa item dalam pesanan ini akan diproduksi khusus. 
                    Anda akan dihubungi ketika pesanan sudah siap untuk diambil.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Dicetak pada: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </CardContent>
    </Card>
  );
}