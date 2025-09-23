import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OwnerKPI {
  todaySalesAll: number;
  todayMarginAll: number;
  lowStockCountAll: number;
  expiringCount: number;
}

interface TopSellingProduct {
  product_name: string;
  total_quantity: number;
}

interface DeadStock {
  product_name: string;
  branch_name: string;
  days_no_movement: number;
  current_stock: number;
}

interface ExpiringProduct {
  product_name: string;
  branch_name: string;
  expiry_date: string;
  quantity: number;
  days_until_expiry: number;
}

export const useOwnerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<OwnerKPI>({
    todaySalesAll: 0,
    todayMarginAll: 0,
    lowStockCountAll: 0,
    expiringCount: 0
  });
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStock[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (user?.role !== 'owner') return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Fetch today's sales across all branches
      const { data: salesData } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('transaction_date', today)
        .eq('payment_status', 'paid');

      const todaySalesAll = salesData?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

      // Fetch critical stock across all branches (≤ ROP)
      const { data: stockData } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product_id,
          products!product_id(name, reorder_point)
        `);

      const lowStockItems = stockData?.filter(item => {
        const rop = item.products?.reorder_point || 30;
        return item.quantity <= rop;
      }) || [];

      // Fetch expiring products (≤ 3 days from now)
      const { data: expiringData } = await supabase
        .from('product_batches')
        .select(`
          quantity,
          expiry_date,
          products!inner(name),
          branches!inner(name)
        `)
        .lte('expiry_date', threeDaysFromNow.toISOString().split('T')[0])
        .eq('status', 'active')
        .gt('quantity', 0);

      const expiringItems = expiringData?.map(item => ({
        product_name: item.products?.name || '',
        branch_name: item.branches?.name || '',
        expiry_date: item.expiry_date,
        quantity: item.quantity,
        days_until_expiry: Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      })) || [];

      // Fetch top selling products (last 7 days)
      const { data: topProductsData } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          product_id,
          products!product_id(name),
          transaction_id,
          transactions!transaction_id(transaction_date)
        `)
        .gte('transactions.transaction_date', sevenDaysAgo.toISOString().split('T')[0]);

      const productSales = topProductsData?.reduce((acc, item) => {
        const productName = item.products?.name || '';
        acc[productName] = (acc[productName] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      const topSellingProducts = Object.entries(productSales || {})
        .map(([product_name, total_quantity]) => ({ product_name, total_quantity }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      setKpis({
        todaySalesAll,
        todayMarginAll: 0, // Placeholder for margin calculation
        lowStockCountAll: lowStockItems.length,
        expiringCount: expiringItems.length
      });

      setTopProducts(topSellingProducts);
      setExpiringProducts(expiringItems.slice(0, 10));

    } catch (error) {
      console.error('Error fetching owner dashboard data:', error);
      toast({
        title: "Gagal memuat data dashboard",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  return {
    kpis,
    topProducts,
    deadStock,
    expiringProducts,
    loading,
    refreshData: fetchDashboardData
  };
};