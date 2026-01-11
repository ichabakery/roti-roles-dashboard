
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface DeliveryOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  branch_id: string;
  branch_name: string | null;
  delivery_address: string | null;
  delivery_date: string;
  tracking_status: string;
  payment_status: string | null;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

export type DeliveryTab = 'pending' | 'in_transit' | 'history';

const TRACKING_STATUS_MAP: Record<DeliveryTab, string[]> = {
  pending: ['in_production', 'ready_to_ship'],
  in_transit: ['in_transit', 'arrived_at_store'],
  history: ['delivered']
};

export const useDeliveryOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DeliveryTab>('pending');

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const trackingStatuses = TRACKING_STATUS_MAP[activeTab];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          branch_id,
          delivery_address,
          delivery_date,
          tracking_status,
          payment_status,
          total_amount,
          notes,
          created_at,
          branches:branch_id (name)
        `)
        .in('tracking_status', trackingStatuses)
        .order('delivery_date', { ascending: true });

      if (error) throw error;

      const formattedOrders: DeliveryOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        branch_id: order.branch_id,
        branch_name: order.branches?.name || 'Unknown',
        delivery_address: order.delivery_address,
        delivery_date: order.delivery_date,
        tracking_status: order.tracking_status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        notes: order.notes,
        created_at: order.created_at
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
      toast.error('Gagal mengambil data pesanan');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  const updateTrackingStatus = async (orderId: string, newStatus: string) => {
    try {
      // Validation: delivered requires payment to be paid
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.payment_status !== 'paid') {
          toast.error('Pesanan harus sudah lunas sebelum bisa ditandai sebagai selesai');
          return false;
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          tracking_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status tracking berhasil diupdate');
      await fetchOrders();
      return true;
    } catch (error: any) {
      console.error('Error updating tracking status:', error);
      toast.error('Gagal update status tracking');
      return false;
    }
  };

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('delivery-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('Order changed, refreshing...');
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orderCounts = {
    pending: orders.filter(o => ['in_production', 'ready_to_ship'].includes(o.tracking_status)).length,
    in_transit: orders.filter(o => ['in_transit', 'arrived_at_store'].includes(o.tracking_status)).length,
    history: orders.filter(o => o.tracking_status === 'delivered').length
  };

  return {
    orders,
    loading,
    activeTab,
    setActiveTab,
    updateTrackingStatus,
    refreshOrders: fetchOrders,
    orderCounts
  };
};
