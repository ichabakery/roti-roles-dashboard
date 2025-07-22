import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  orderDate: string;
  deliveryDate: string;
  branchId: string;
  branchName: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt?: string;
}

export const orderService = {
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt'>) {
    // Generate order number (format: ORD-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    const newOrder = {
      ...orderData,
      orderNumber,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrders(branchId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('branchId', branchId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
