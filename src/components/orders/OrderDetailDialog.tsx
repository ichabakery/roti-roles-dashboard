import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { orderService, type Order, getOrderStatusLabel, getTrackingStatusLabel, TrackingStatus, TRACKING_STATUS_ORDER } from '@/services/orderService';
import { OrderPaymentDialog } from './OrderPaymentDialog';
import { EditOrderDialog } from './EditOrderDialog';
import { TrackingTimeline } from './TrackingTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  User, 
  Phone, 
  Calendar, 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Edit,
  Truck,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface OrderDetailDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  onOrderUpdate: (updatedOrder: Order) => void;
}

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string;
  notes: string | null;
}

interface OrderTrackingHistory {
  id: string;
  old_tracking_status: string | null;
  new_tracking_status: string;
  updated_at: string;
  updated_by: string | null;
  notes: string | null;
}

export const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({
  open,
  onClose,
  orderId,
  onOrderUpdate
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [trackingHistory, setTrackingHistory] = useState<OrderTrackingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const [orderData, historyData, trackingData] = await Promise.all([
        orderService.getOrderById(orderId),
        orderService.getOrderStatusHistory(orderId),
        orderService.getOrderTrackingHistory(orderId)
      ]);
      
      setOrder(orderData);
      setStatusHistory(historyData);
      setTrackingHistory(trackingData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Gagal memuat detail pesanan",
        description: "Terjadi kesalahan saat memuat detail pesanan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;

    // Validate: can only complete if payment is paid
    if (newStatus === 'completed' && order.payment_status !== 'paid') {
      toast({
        title: "Tidak bisa menyelesaikan pesanan",
        description: "Pembayaran belum lunas. Lunasi pembayaran terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdating(true);
      const updatedOrder = await orderService.updateOrderStatus(order.id!, newStatus, notes);
      setOrder(updatedOrder);
      onOrderUpdate(updatedOrder);
      setNotes('');
      
      // Refresh histories
      const [historyData, trackingData] = await Promise.all([
        orderService.getOrderStatusHistory(order.id!),
        orderService.getOrderTrackingHistory(order.id!)
      ]);
      setStatusHistory(historyData);
      setTrackingHistory(trackingData);
      
      toast({
        title: "Status pesanan diperbarui",
        description: `Status pesanan berhasil diubah menjadi ${getOrderStatusLabel(newStatus)}`
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status pesanan",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleTrackingUpdate = async (newTrackingStatus: TrackingStatus) => {
    if (!order) return;

    // Validate: can only mark as delivered if payment is paid
    if (newTrackingStatus === 'delivered' && order.payment_status !== 'paid') {
      toast({
        title: "Tidak bisa menandai diserahkan",
        description: "Pembayaran belum lunas. Lunasi pembayaran terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUpdating(true);
      const updatedOrder = await orderService.updateTrackingStatus(order.id!, newTrackingStatus, notes);
      setOrder(updatedOrder);
      onOrderUpdate(updatedOrder);
      setNotes('');
      
      // Refresh tracking history
      const trackingData = await orderService.getOrderTrackingHistory(order.id!);
      setTrackingHistory(trackingData);
      
      toast({
        title: "Tracking diperbarui",
        description: `Tracking berhasil diubah menjadi ${getTrackingStatusLabel(newTrackingStatus)}`
      });
    } catch (error: any) {
      console.error('Error updating tracking status:', error);
      toast({
        title: "Gagal memperbarui tracking",
        description: error.message || "Terjadi kesalahan saat memperbarui tracking",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      new: <Clock className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status as keyof typeof icons] || <AlertCircle className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          {getOrderStatusLabel(status)}
        </span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get next possible tracking status based on current status and user role
  const getNextTrackingStatuses = (currentTracking: string | undefined): TrackingStatus[] => {
    if (!currentTracking) return [];
    
    const currentIndex = TRACKING_STATUS_ORDER.indexOf(currentTracking as TrackingStatus);
    if (currentIndex === -1 || currentIndex >= TRACKING_STATUS_ORDER.length - 1) return [];
    
    const nextStatuses: TrackingStatus[] = [];
    
    // Delivery can update stages 1-4 (in_production to arrived_at_store)
    // Cashier can only update stage 5 (delivered)
    const isDeliveryRole = user?.role === 'owner' || user?.role === 'admin_pusat' || user?.role === 'kepala_produksi';
    const isCashierRole = user?.role === 'kasir_cabang' || user?.role === 'owner' || user?.role === 'admin_pusat';
    
    for (let i = currentIndex + 1; i < TRACKING_STATUS_ORDER.length; i++) {
      const nextStatus = TRACKING_STATUS_ORDER[i];
      
      // Delivery roles can update to any status except delivered (unless also cashier)
      if (nextStatus !== 'delivered' && isDeliveryRole) {
        nextStatuses.push(nextStatus);
      }
      
      // Cashier can only mark as delivered
      if (nextStatus === 'delivered' && isCashierRole && currentTracking === 'arrived_at_store') {
        nextStatuses.push(nextStatus);
      }
    }
    
    return nextStatuses;
  };

  // Can user complete this order?
  const canCompleteOrder = () => {
    if (!order) return false;
    if (order.status === 'completed' || order.status === 'cancelled') return false;
    return order.payment_status === 'paid';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order && (
              <>
                <ShoppingCart className="h-5 w-5" />
                Detail Pesanan {order.order_number}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap, tracking posisi, dan manajemen pesanan
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-semibold">{order.order_number}</h3>
                <p className="text-muted-foreground">
                  Dibuat pada {format(new Date(order.created_at!), 'PPpp', { locale: id })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(order.status)}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Tracking Timeline - Visual Progress */}
            {order.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tracking Posisi Produk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackingTimeline 
                    currentStatus={order.tracking_status} 
                    orderStatus={order.status}
                  />
                  
                  {/* Tracking Update Actions */}
                  {order.status === 'new' && getNextTrackingStatuses(order.tracking_status).length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Update Tracking:</p>
                      <div className="flex flex-wrap gap-2">
                        {getNextTrackingStatuses(order.tracking_status).map((status) => (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTrackingUpdate(status)}
                            disabled={updating}
                            className="flex items-center gap-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                            {getTrackingStatusLabel(status)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tanggal Pemesanan</p>
                    <p>{format(new Date(order.order_date), 'PPP', { locale: id })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tanggal Pengambilan</p>
                    <p>{format(new Date(order.delivery_date), 'PPP', { locale: id })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cabang</p>
                    <p>{order.branch_name || 'Unknown Branch'}</p>
                  </div>
                  {(order.shipping_cost || 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ongkir</p>
                      <p className="flex items-center gap-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(order.shipping_cost || 0)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pembayaran</p>
                    <p className="text-lg font-semibold">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
                
                {/* Payment Information */}
                <Separator className="my-3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status Pembayaran</p>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {order.payment_status === 'paid' ? 'Lunas' : 
                       order.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                    </Badge>
                  </div>
                  {(order.dp_amount || 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sudah Dibayar</p>
                      <p className="text-green-600 font-medium">{formatCurrency(order.dp_amount || 0)}</p>
                    </div>
                  )}
                  {(order.remaining_amount || 0) > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sisa Pembayaran</p>
                      <p className="text-orange-600 font-medium">{formatCurrency(order.remaining_amount || 0)}</p>
                    </div>
                  )}
                </div>
                
                {/* Payment Button */}
                {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                  <div className="pt-3">
                    <Button 
                      onClick={() => setShowPaymentDialog(true)}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proses Pembayaran
                    </Button>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Catatan</p>
                    <p className="text-sm bg-muted p-2 rounded">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Item Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status Actions */}
            {order.status === 'new' && (
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catatan (opsional)</label>
                    <Textarea
                      placeholder="Tambahkan catatan untuk perubahan status..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={updating || !canCompleteOrder()}
                      className="flex items-center gap-2"
                      title={!canCompleteOrder() ? "Pembayaran belum lunas" : undefined}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Selesaikan Pesanan
                    </Button>
                    {!canCompleteOrder() && order.payment_status !== 'paid' && (
                      <p className="text-sm text-orange-600 self-center">
                        ⚠️ Lunasi pembayaran terlebih dahulu
                      </p>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={updating}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Batalkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking History */}
            {trackingHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trackingHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="flex-shrink-0">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getTrackingStatusLabel(entry.new_tracking_status)}</span>
                            {entry.old_tracking_status && (
                              <span className="text-sm text-muted-foreground">
                                dari {getTrackingStatusLabel(entry.old_tracking_status)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.updated_at), 'PPpp', { locale: id })}
                          </p>
                          {entry.notes && (
                            <p className="text-sm mt-1 bg-muted p-2 rounded">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Status Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statusHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                        <div className="flex-shrink-0">
                          {getStatusIcon(entry.new_status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getOrderStatusLabel(entry.new_status)}</span>
                            {entry.old_status && (
                              <span className="text-sm text-muted-foreground">
                                dari {getOrderStatusLabel(entry.old_status)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.changed_at), 'PPpp', { locale: id })}
                          </p>
                          {entry.notes && (
                            <p className="text-sm mt-1 bg-muted p-2 rounded">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
          </div>
        )}
        
        {/* Payment Dialog */}
        <OrderPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          order={order}
          onPaymentComplete={(updatedOrder) => {
            setOrder(updatedOrder);
            onOrderUpdate(updatedOrder);
          }}
        />
        
        {/* Edit Dialog */}
        <EditOrderDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          order={order}
          onOrderUpdated={(updatedOrder) => {
            setOrder(updatedOrder);
            onOrderUpdate(updatedOrder);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
