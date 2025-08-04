import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, Square, Edit3 } from 'lucide-react';
import type { Order } from '@/services/orderService';

interface BulkOrderActionsProps {
  orders: Order[];
  onOrdersUpdate: (updatedOrders: Order[]) => void;
}

export const BulkOrderActions: React.FC<BulkOrderActionsProps> = ({
  orders,
  onOrdersUpdate
}) => {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(order => order.id!)));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedOrders.size === 0) return;

    try {
      setLoading(true);
      const orderIds = Array.from(selectedOrders);
      
      const { data: updatedCount, error } = await supabase.rpc('bulk_update_order_status', {
        order_ids: orderIds,
        new_status: bulkStatus,
        notes: bulkNotes || null
      });

      if (error) throw error;

      // Refresh orders
      const updatedOrders = orders.map(order => {
        if (selectedOrders.has(order.id!)) {
          return { ...order, status: bulkStatus as Order['status'] };
        }
        return order;
      });

      onOrdersUpdate(updatedOrders);
      setSelectedOrders(new Set());
      setShowBulkDialog(false);
      setBulkStatus('');
      setBulkNotes('');

      toast({
        title: "Berhasil",
        description: `${updatedCount} pesanan berhasil diperbarui`
      });
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      toast({
        title: "Gagal memperbarui pesanan",
        description: "Terjadi kesalahan saat memperbarui pesanan secara massal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      pending: 'Menunggu Konfirmasi',
      confirmed: 'Dikonfirmasi',
      in_production: 'Dalam Produksi',
      ready: 'Siap Diambil',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  if (orders.length === 0) return null;

  return (
    <>
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedOrders.size === orders.length ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Batalkan Semua
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Pilih Semua
                  </>
                )}
              </Button>
              
              {selectedOrders.size > 0 && (
                <Badge variant="secondary">
                  {selectedOrders.size} pesanan dipilih
                </Badge>
              )}
            </div>

            {selectedOrders.size > 0 && (
              <Button
                onClick={() => setShowBulkDialog(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Update Status Massal
              </Button>
            )}
          </div>
          
          {/* Order Selection */}
          <div className="mt-4 space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedOrders.has(order.id!)}
                    onCheckedChange={() => handleSelectOrder(order.id!)}
                  />
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_name}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Massal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Memperbarui status untuk {selectedOrders.size} pesanan
              </p>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status baru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="in_production">Dalam Produksi</SelectItem>
                  <SelectItem value="ready">Siap Diambil</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Textarea
                placeholder="Tambahkan catatan untuk perubahan status..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || loading}
            >
              {loading ? 'Memperbarui...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};