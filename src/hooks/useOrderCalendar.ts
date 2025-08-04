import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarData {
  delivery_date: string;
  order_count: number;
  total_amount: number;
  status_breakdown: any;
}

export const useOrderCalendar = (
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  branchId?: string
) => {
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_order_calendar_data', {
        p_year: year,
        p_month: month,
        p_branch_id: branchId || null
      });

      if (error) throw error;
      setCalendarData((data || []) as CalendarData[]);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: "Gagal memuat data kalender",
        description: "Terjadi kesalahan saat memuat data kalender pesanan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [year, month, branchId]);

  return {
    calendarData,
    loading,
    refreshCalendarData: fetchCalendarData
  };
};