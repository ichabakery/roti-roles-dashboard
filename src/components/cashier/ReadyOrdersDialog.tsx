import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, User, Calendar, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  delivery_date: string;
  total_amount: number;
  items: any;
  notes?: string;
  branch_name?: string;
}

interface ReadyOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
}

const ReadyOrdersDialog: React.FC<ReadyOrdersDialogProps> = ({
  open,
  onOpenChange,
  branchId
}) => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && branchId) {
      fetchReadyOrders();
    }
  }, [open, branchId]);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          branches!orders_branch_id_fkey(name)
        `)
        .eq('status', 'ready')
        .eq('branch_id', branchId)
        .order('delivery_date', { ascending: true });

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        ...order,
        branch_name: order.branches?.name || 'Unknown Branch',
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
      }));

      setReadyOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching ready orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat pesanan siap diambil'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrder = async (order: Order) => {
    try {
      setProcessingOrder(order.id);

      // Update order status to completed (this will trigger the pickup function)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Pesanan ${order.order_number} telah diproses dan transaksi telah dibuat`
      });

      // Remove from ready orders list
      setReadyOrders(prev => prev.filter(o => o.id !== order.id));
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memproses pesanan'
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, dd MMMM yyyy', { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Pesanan Siap Diambil
          </DialogTitle>
          <DialogDescription>
            Daftar pesanan yang sudah selesai diproduksi dan siap untuk diambil pelanggan
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : readyOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tidak ada pesanan yang siap diambil saat ini</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {readyOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customer_name}
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {order.customer_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.delivery_date)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Siap Diambil
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Item Pesanan:</h4>
                      <div className="space-y-1">
                        {order.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.productName} x {item.quantity}</span>
                            <span>{formatPrice(item.quantity * item.unitPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span className="text-lg">{formatPrice(order.total_amount)}</span>
                    </div>

                    {order.notes && (
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>Catatan:</strong> {order.notes}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleProcessOrder(order)}
                        disabled={processingOrder === order.id}
                        className="flex-1"
                      >
                        {processingOrder === order.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Proses Pengambilan
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReadyOrdersDialog;