import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProductionKPI {
  todayRequests: number;
  lowStockForTomorrow: number;
  completedBatches: number;
  todayWastage: number;
}

interface ProductionPlan {
  sku: string;
  product_name: string;
  planned: number;
  realized: number;
  difference: number;
}

interface ExpiringBatch {
  batch_number: string;
  product_name: string;
  expiry_date: string;
  quantity: number;
}

export const useProductionDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<ProductionKPI>({
    todayRequests: 0,
    lowStockForTomorrow: 0,
    completedBatches: 0,
    todayWastage: 0
  });
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<ExpiringBatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (user?.role !== 'kepala_produksi') return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's production requests
      const { data: requestsData } = await supabase
        .from('production_requests')
        .select('id')
        .eq('production_date', today);

      const todayRequests = requestsData?.length || 0;

      // Fetch completed batches today
      const { data: batchesData } = await supabase
        .from('production_requests')
        .select('id')
        .eq('status', 'completed')
        .gte('updated_at', today);

      const completedBatches = batchesData?.length || 0;

      // Fetch products needing production (≤ ROP + lead time)
      const { data: stockData } = await supabase
        .from('inventory')
        .select(`
          quantity,
          product_id,
          products!product_id(name, reorder_point, lead_time_days)
        `);

      const needProductionItems = stockData?.filter(item => {
        const rop = item.products?.reorder_point || 30;
        const leadTime = item.products?.lead_time_days || 2;
        return item.quantity <= (rop + leadTime);
      }) || [];

      // Fetch expiring batches (≤ 1 day)
      const { data: expiringData } = await supabase
        .from('product_batches')
        .select(`
          batch_number,
          expiry_date,
          quantity,
          products!inner(name)
        `)
        .lte('expiry_date', tomorrow.toISOString().split('T')[0])
        .eq('status', 'active')
        .gt('quantity', 0);

      const expiringItems = expiringData?.map(item => ({
        batch_number: item.batch_number,
        product_name: item.products?.name || '',
        expiry_date: item.expiry_date,
        quantity: item.quantity
      })) || [];

      // Fetch production plans vs realization
      const { data: plansData } = await supabase
        .from('production_requests')
        .select(`
          quantity_requested,
          quantity_produced,
          product_id,
          products!product_id(name, sku)
        `)
        .eq('production_date', today);

      const plans = plansData?.map(item => ({
        sku: item.products?.sku || 'N/A',
        product_name: item.products?.name || '',
        planned: item.quantity_requested,
        realized: item.quantity_produced || 0,
        difference: (item.quantity_produced || 0) - item.quantity_requested
      })) || [];

      setKpis({
        todayRequests,
        lowStockForTomorrow: needProductionItems.length,
        completedBatches,
        todayWastage: 0 // Placeholder
      });

      setProductionPlans(plans);
      setExpiringBatches(expiringItems);

    } catch (error) {
      console.error('Error fetching production dashboard data:', error);
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
    productionPlans,
    expiringBatches,
    loading,
    refreshData: fetchDashboardData
  };
};