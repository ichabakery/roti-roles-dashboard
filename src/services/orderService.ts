import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormData {
  customer_name: string;
  customer_phone: string;
  order_date: string;
  delivery_date: string;
  notes?: string;
  items: OrderItem[];
}

// Simplified status: 3 states
export type OrderStatus = 'new' | 'completed' | 'cancelled';

// Tracking status: 5 stages
export type TrackingStatus = 'in_production' | 'ready_to_ship' | 'in_transit' | 'arrived_at_store' | 'delivered';

export interface Order {
  id?: string;
  order_number: string;
  branch_id: string;
  branch_name?: string;
  branch_address?: string;
  branch_phone?: string;
  customer_name: string;
  customer_phone?: string;
  order_date: string;
  delivery_date: string;
  status: OrderStatus;
  tracking_status?: TrackingStatus;
  total_amount: number;
  shipping_cost?: number;
  payment_type?: 'cash_on_delivery' | 'dp' | 'full_payment';
  payment_status?: 'pending' | 'partial' | 'paid' | 'full_payment';
  dp_amount?: number;
  remaining_amount?: number;
  delivery_address?: string;
  linked_transaction_id?: string;
  notes?: string;
  items?: any;
  created_at?: string;
  created_by: string;
  courier_id?: string | null;
  courier_name?: string | null;
}

export interface TrackingHistoryEntry {
  id: string;
  order_id: string;
  old_tracking_status: string | null;
  new_tracking_status: string;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
}

// Helper functions for tracking status
export const getTrackingStatusLabel = (status: TrackingStatus | string | null | undefined): string => {
  const labels: Record<string, string> = {
    'in_production': 'Menunggu/Diproduksi',
    'ready_to_ship': 'Siap Kirim',
    'in_transit': 'Dalam Perjalanan',
    'arrived_at_store': 'Tiba di Toko',
    'delivered': 'Diserahkan'
  };
  return labels[status || ''] || 'Tidak Diketahui';
};

export const getOrderStatusLabel = (status: OrderStatus | string): string => {
  const labels: Record<string, string> = {
    'new': 'Baru',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return labels[status] || status;
};

export const TRACKING_STATUS_ORDER: TrackingStatus[] = [
  'in_production',
  'ready_to_ship',
  'in_transit',
  'arrived_at_store',
  'delivered'
];

export const orderService = {
  async createOrder(orderData: OrderFormData & { 
    branch_id: string, 
    created_by: string, 
    payment_type?: string,
    dp_amount?: number,
    delivery_address?: string,
    pickup_branch_id?: string,
    shipping_cost?: number
  }) {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    // Validate items first
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Pesanan harus memiliki minimal 1 item');
    }

    // Calculate total (subtotal + shipping)
    const subtotal = orderData.items.reduce((total, item) => 
      total + (item.quantity * item.unitPrice), 0);
    const shipping_cost = orderData.shipping_cost || 0;
    const total_amount = subtotal + shipping_cost;

    // Calculate payment details
    const payment_status = orderData.payment_type === 'full_payment' ? 'paid' : 'pending';
    const remaining_amount = orderData.payment_type === 'dp' ? 
      total_amount - (orderData.dp_amount || 0) : 
      orderData.payment_type === 'full_payment' ? 0 : total_amount;

    // Orders always start as 'new' with tracking 'in_production'
    const initial_status: OrderStatus = 'new';
    const initial_tracking: TrackingStatus = 'in_production';

    const newOrder = {
      branch_id: orderData.branch_id,
      pickup_branch_id: orderData.pickup_branch_id || orderData.branch_id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      order_date: orderData.order_date,
      delivery_date: orderData.delivery_date,
      total_amount,
      shipping_cost,
      payment_type: orderData.payment_type || 'cash_on_delivery',
      payment_status,
      dp_amount: orderData.dp_amount || 0,
      remaining_amount,
      delivery_address: orderData.delivery_address,
      items: orderData.items,
      notes: orderData.notes,
      status: initial_status,
      tracking_status: initial_tracking,
      created_by: orderData.created_by
    };

    // Prepare items payload (without stock-related fields)
    const itemsPayload = (orderData.items || []).map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    }));

    // Retry loop to handle duplicate order number conflicts
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Creating order (attempt ${attempt}/${MAX_RETRIES}):`, { ...newOrder, items: itemsPayload });
        
        // Create the order
        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert({
            ...newOrder,
            items: itemsPayload
          } as any)
          .select()
          .single();
          
        console.log('Order creation result:', { orderResult, orderError });

        if (orderError) {
          // Check if it's a duplicate key error on order_number
          if (orderError.message.includes('orders_order_number_key') || 
              orderError.message.includes('duplicate key')) {
            console.log(`Attempt ${attempt}: Order number conflict detected, retrying...`);
            // Add small random delay to reduce collision probability
            await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
            continue; // Retry
          }
          // For other errors, throw immediately
          throw new Error(`Gagal membuat pesanan: ${orderError.message}`);
        }

        // Success! Create order items in normalized table
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
          const orderItems = orderData.items.map((item: any) => ({
            order_id: orderResult.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Error creating order items:', itemsError);
            console.warn('Order created but order items failed to create:', itemsError.message);
          }
        }

        return orderResult;
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        // If it's not a duplicate key error, don't retry
        if (!error.message?.includes('orders_order_number_key') && 
            !error.message?.includes('duplicate key')) {
          break;
        }
        
        if (attempt === MAX_RETRIES) {
          console.error('All retry attempts exhausted');
          break;
        }
      }
    }

    throw lastError || new Error('Gagal membuat pesanan setelah beberapa percobaan. Silakan coba lagi.');
  },

  async getOrders(branch_id?: string) {
    try {
      // Use the enhanced function for better owner access
      const { data, error } = await supabase
        .rpc('get_orders_for_user', { p_branch_id: branch_id || null });

      if (error) throw error;
      
      // Parse items back to array if they're stringified
      const parsedData = data.map((order: any) => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));
      
      return parsedData as Order[];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    
    // Get branch info separately (name, address, phone)
    const { data: branchData } = await supabase
      .from('branches')
      .select('name, address, phone')
      .eq('id', data.branch_id)
      .single();
    
    // Parse items back to array if they're stringified
    const parsedItems = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
    
    return {
      ...data,
      items: parsedItems,
      branch_name: branchData?.name,
      branch_address: branchData?.address || '',
      branch_phone: branchData?.phone || ''
    } as Order;
  },

  async getOrderStatusHistory(orderId: string) {
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getOrderTrackingHistory(orderId: string): Promise<TrackingHistoryEntry[]> {
    const { data, error } = await supabase
      .from('order_tracking_history')
      .select('*')
      .eq('order_id', orderId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw error;
    
    // Get branch name separately  
    const { data: branchData } = await supabase
      .from('branches')
      .select('name')
      .eq('id', data.branch_id)
      .single();
    
    return {
      ...data,
      branch_name: branchData?.name
    } as Order;
  },

  async updateTrackingStatus(orderId: string, trackingStatus: TrackingStatus, notes?: string) {
    // First check current order state
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('payment_status, status, tracking_status')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;

    // Validate: can't mark as delivered if payment not complete
    if (trackingStatus === 'delivered' && currentOrder.payment_status !== 'paid') {
      throw new Error('Tidak dapat menandai pesanan sebagai "Diserahkan" karena pembayaran belum lunas. Silakan lunasi pembayaran terlebih dahulu.');
    }

    // Update tracking status
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        tracking_status: trackingStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw error;
    
    // Get branch name separately  
    const { data: branchData } = await supabase
      .from('branches')
      .select('name')
      .eq('id', data.branch_id)
      .single();
    
    return {
      ...data,
      branch_name: branchData?.name
    } as Order;
  },

  async createProductionRequest(orderId: string, productId: string, quantity: number, branchId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('production_requests')
        .insert({
          product_id: productId,
          branch_id: branchId,
          quantity_requested: quantity,
          production_date: new Date().toISOString().split('T')[0],
          notes: `Permintaan produksi dari pesanan ${orderId}`,
          requested_by: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating production request:', error);
      throw error;
    }
  },

  async updateOrder(orderId: string, orderData: Partial<OrderFormData> & { 
    shipping_cost?: number,
    customer_name?: string,
    customer_phone?: string,
    delivery_date?: string,
    notes?: string,
    items?: any[]
  }) {
    try {
      // Calculate new total if items are provided
      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (orderData.customer_name) updateData.customer_name = orderData.customer_name;
      if (orderData.customer_phone !== undefined) updateData.customer_phone = orderData.customer_phone;
      if (orderData.delivery_date) updateData.delivery_date = orderData.delivery_date;
      if (orderData.notes !== undefined) updateData.notes = orderData.notes;
      if (orderData.shipping_cost !== undefined) updateData.shipping_cost = orderData.shipping_cost;
      
      if (orderData.items) {
        updateData.items = orderData.items;
        // Recalculate total
        const subtotal = orderData.items.reduce((total, item) => 
          total + (item.quantity * item.unitPrice), 0);
        const shipping = orderData.shipping_cost || 0;
        updateData.total_amount = subtotal + shipping;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) throw error;

      // Update order_items if items changed
      if (orderData.items) {
        // Delete existing items
        await supabase.from('order_items').delete().eq('order_id', orderId);
        
        // Insert new items
        const orderItems = orderData.items.map((item: any) => ({
          order_id: orderId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.quantity * item.unitPrice
        }));

        await supabase.from('order_items').insert(orderItems);
      }

      // Get branch name
      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('id', data.branch_id)
        .single();

      return {
        ...data,
        branch_name: branchData?.name
      } as Order;
    } catch (error: any) {
      console.error('Error updating order:', error);
      throw new Error(error.message || 'Gagal memperbarui pesanan');
    }
  },

  // Assign courier to order (admin/owner)
  async assignCourier(orderId: string, courierId: string | null) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          courier_id: courierId,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) throw error;

      // Get branch name
      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('id', data.branch_id)
        .single();

      return {
        ...data,
        branch_name: branchData?.name
      } as Order;
    } catch (error: any) {
      console.error('Error assigning courier:', error);
      throw new Error(error.message || 'Gagal menugaskan kurir');
    }
  }
};
