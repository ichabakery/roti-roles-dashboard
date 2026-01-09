import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Receipt, CheckCircle, XCircle, Edit } from 'lucide-react';
import type { Order } from '@/services/orderService';
import { getTrackingStatusLabel } from '@/services/orderService';

interface OrdersTableProps {
  orders: Order[];
  onViewDetail: (orderId: string) => void;
  onShowReceipt: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onQuickStatusChange: (orderId: string, status: 'completed' | 'cancelled') => void;
  formatCurrency: (amount: number) => string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onViewDetail,
  onShowReceipt,
  onEditOrder,
  onQuickStatusChange,
  formatCurrency
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Baru', variant: 'secondary' as const },
      completed: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
      // Legacy support
      pending: { label: 'Baru', variant: 'secondary' as const },
      confirmed: { label: 'Baru', variant: 'secondary' as const },
      in_production: { label: 'Baru', variant: 'secondary' as const },
      ready: { label: 'Baru', variant: 'secondary' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTrackingBadge = (tracking: string | undefined) => {
    if (!tracking) return null;
    return (
      <Badge variant="outline" className="text-xs">
        {getTrackingStatusLabel(tracking)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const canChangeStatus = (status: string) => {
    return !['completed', 'cancelled'].includes(status);
  };

  return (
    <div className="bg-background rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>No. Pesanan</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead className="hidden md:table-cell">Cabang</TableHead>
            <TableHead>Tgl Kirim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Tracking</TableHead>
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
                {order.branch_name || '-'}
              </TableCell>
              <TableCell>
                {formatDate(order.delivery_date)}
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {getTrackingBadge(order.tracking_status)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(order.total_amount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  {/* Quick Action Buttons */}
                  {canChangeStatus(order.status) && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onQuickStatusChange(order.id!, 'completed')}
                        title="Selesai"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onQuickStatusChange(order.id!, 'cancelled')}
                        title="Batalkan"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {canChangeStatus(order.status) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditOrder(order)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
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
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Tidak ada pesanan ditemukan
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
