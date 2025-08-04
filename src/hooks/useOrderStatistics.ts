import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderStatistics {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_production_orders: number;
  ready_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export const useOrderStatistics = (
  branchId?: string,
  startDate?: string,
  endDate?: string
) => {
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_order_statistics', {
        p_branch_id: branchId || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) throw error;
      setStatistics(data[0] || null);
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      toast({
        title: "Gagal memuat statistik",
        description: "Terjadi kesalahan saat memuat statistik pesanan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [branchId, startDate, endDate]);

  return {
    statistics,
    loading,
    refreshStatistics: fetchStatistics
  };
};