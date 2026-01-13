
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
  courier_id: string | null;
  courier_name: string | null;
}

export type DeliveryTab = 'pending' | 'in_transit' | 'history';

export const useDeliveryOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DeliveryTab>('pending');
  const [allOrderCounts, setAllOrderCounts] = useState({ pending: 0, in_transit: 0, history: 0 });

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const isKurir = user.role === 'kurir';
      
      let query = supabase
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
          courier_id,
          courier_name,
          branches:branch_id (name)
        `)
        .order('delivery_date', { ascending: true });

      // Filter berdasarkan tab dan role
      if (isKurir) {
        if (activeTab === 'pending') {
          // Pesanan ready_to_ship yang BELUM ada kurir (tersedia untuk diambil)
          query = query
            .eq('tracking_status', 'ready_to_ship')
            .is('courier_id', null);
        } else if (activeTab === 'in_transit') {
          // Pesanan milik kurir ini yang sedang dalam perjalanan
          query = query
            .in('tracking_status', ['in_transit', 'arrived_at_store'])
            .eq('courier_id', user.id);
        } else {
          // Riwayat pengantaran kurir ini
          query = query
            .eq('tracking_status', 'delivered')
            .eq('courier_id', user.id);
        }
      } else {
        // Untuk non-kurir (owner, admin, kasir) - lihat semua berdasarkan tracking status
        if (activeTab === 'pending') {
          query = query.in('tracking_status', ['in_production', 'ready_to_ship']);
        } else if (activeTab === 'in_transit') {
          query = query.in('tracking_status', ['in_transit', 'arrived_at_store']);
        } else {
          query = query.eq('tracking_status', 'delivered');
        }
      }

      const { data, error } = await query;

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
        created_at: order.created_at,
        courier_id: order.courier_id,
        courier_name: order.courier_name
      }));

      setOrders(formattedOrders);
      
      // Update counts untuk kurir
      if (isKurir) {
        await fetchOrderCounts();
      }
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
      toast.error('Gagal mengambil data pesanan');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  // Fetch order counts untuk badge di tabs
  const fetchOrderCounts = useCallback(async () => {
    if (!user) return;

    const isKurir = user.role === 'kurir';

    try {
      if (isKurir) {
        // Count pesanan tersedia untuk diambil
        const { count: pendingCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('tracking_status', 'ready_to_ship')
          .is('courier_id', null);

        // Count pesanan sedang diantar oleh kurir ini
        const { count: inTransitCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('tracking_status', ['in_transit', 'arrived_at_store'])
          .eq('courier_id', user.id);

        // Count riwayat pengantaran kurir ini
        const { count: historyCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('tracking_status', 'delivered')
          .eq('courier_id', user.id);

        setAllOrderCounts({
          pending: pendingCount || 0,
          in_transit: inTransitCount || 0,
          history: historyCount || 0
        });
      } else {
        // Untuk non-kurir, count berdasarkan tracking status saja
        const { count: pendingCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('tracking_status', ['in_production', 'ready_to_ship']);

        const { count: inTransitCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('tracking_status', ['in_transit', 'arrived_at_store']);

        const { count: historyCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('tracking_status', 'delivered');

        setAllOrderCounts({
          pending: pendingCount || 0,
          in_transit: inTransitCount || 0,
          history: historyCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  }, [user]);

  // Kurir self-assign pesanan
  const assignToSelf = async (orderId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          courier_id: user.id,
          tracking_status: 'in_transit', // Auto update ke in_transit saat diambil
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .is('courier_id', null); // Hanya jika belum ada kurir

      if (error) throw error;

      toast.success('Pesanan berhasil diambil!');
      await fetchOrders();
      return true;
    } catch (error: any) {
      console.error('Error assigning order:', error);
      toast.error('Gagal mengambil pesanan');
      return false;
    }
  };

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
          fetchOrderCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders, fetchOrderCounts]);

  useEffect(() => {
    fetchOrders();
    fetchOrderCounts();
  }, [fetchOrders, fetchOrderCounts]);

  return {
    orders,
    loading,
    activeTab,
    setActiveTab,
    updateTrackingStatus,
    assignToSelf,
    refreshOrders: fetchOrders,
    orderCounts: allOrderCounts,
    isKurir: user?.role === 'kurir'
  };
};
