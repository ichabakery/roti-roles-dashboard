import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Receipt } from 'lucide-react';
import type { Order } from '@/services/orderService';

interface OrdersTableProps {
  orders: Order[];
  onViewDetail: (orderId: string) => void;
  onShowReceipt: (order: Order) => void;
  formatCurrency: (amount: number) => string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewDetail,
  onShowReceipt,
  formatCurrency
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      in_production: { label: 'Produksi', variant: 'outline' as const },
      ready: { label: 'Siap', variant: 'secondary' as const },
      completed: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>No. Pesanan</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead className="hidden md:table-cell">Telepon</TableHead>
            <TableHead className="hidden lg:table-cell">Cabang</TableHead>
            <TableHead>Tgl Kirim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-sm font-medium">
                {order.order_number}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {order.customer_phone || '-'}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {order.branch_name || '-'}
              </TableCell>
              <TableCell>
                {formatDate(order.delivery_date)}
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(order.total_amount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onShowReceipt(order)}
                    title="Lihat Bukti"
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetail(order.id!)}
                    title="Lihat Detail"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Tidak ada pesanan ditemukan
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
