import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useToast } from '@/hooks/use-toast';

interface CashierKPI {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  todayReturns: number;
}

interface TopSellingProduct {
  product_name: string;
  total_quantity: number;
}

interface TopReturn {
  product_name: string;
  total_quantity: number;
  reason: string;
}

interface CriticalStock {
  product_name: string;
  current_stock: number;
  reorder_point: number;
}

export const useCashierDashboard = () => {
  const { user } = useAuth();
  const { userBranch } = useUserBranch();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<CashierKPI>({
    todaySales: 0,
    todayTransactions: 0,
    lowStockCount: 0,
    todayReturns: 0
  });
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [topReturns, setTopReturns] = useState<TopReturn[]>([]);
  const [criticalStock, setCriticalStock] = useState<CriticalStock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!userBranch.branchId || user?.role !== 'kasir_cabang') return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's sales and transactions
      const { data: salesData } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('branch_id', userBranch.branchId)
        .gte('transaction_date', today)
        .eq('payment_status', 'paid');

      const todaySales = salesData?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
      const todayTransactions = salesData?.length || 0;

      // Fetch today's returns
      const { data: returnsData } = await supabase
        .from('returns')
        .select('id')
        .eq('branch_id', userBranch.branchId)
        .gte('return_date', today);

      const todayReturns = returnsData?.length || 0;

      // Fetch critical stock (≤ ROP)
      const { data: stockData } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product_id,
          products!product_id(name, reorder_point)
        `)
        .eq('branch_id', userBranch.branchId);

      const criticalStockItems = stockData?.filter(item => {
        const rop = item.products?.reorder_point || 30;
        return item.quantity <= rop;
      }) || [];

      setCriticalStock(criticalStockItems.slice(0, 5).map(item => ({
        product_name: item.products?.name || '',
        current_stock: item.quantity,
        reorder_point: item.products?.reorder_point || 30
      })));

      // Fetch top selling products today
      const { data: topProductsData } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          product_id,
          products!product_id(name),
          transaction_id,
          transactions!transaction_id(branch_id, transaction_date)
        `)
        .eq('transactions.branch_id', userBranch.branchId)
        .gte('transactions.transaction_date', today);

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
        todaySales,
        todayTransactions,
        lowStockCount: criticalStockItems.length,
        todayReturns
      });
      setTopProducts(topSellingProducts);
      setCriticalStock(criticalStockItems.slice(0, 5).map(item => ({
        product_name: item.products?.name || '',
        current_stock: item.quantity,
        reorder_point: item.products?.reorder_point || 30
      })));

    } catch (error) {
      console.error('Error fetching cashier dashboard data:', error);
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
  }, [userBranch.branchId, user?.role]);

  return {
    kpis,
    topProducts,
    topReturns,
    criticalStock,
    loading,
    refreshData: fetchDashboardData
  };
};