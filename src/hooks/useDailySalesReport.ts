
import { useState, useEffect } from 'react';
import { fetchDailySalesReport, DailySalesReportItem, DailySalesReportSummary } from '@/services/dailySalesReportService';
import { useToast } from '@/hooks/use-toast';

export const useDailySalesReport = (selectedDate: string, branchId: string | null) => {
  const [items, setItems] = useState<DailySalesReportItem[]>([]);
  const [summary, setSummary] = useState<DailySalesReportSummary>({
    total_pendapatan: 0,
    total_penjualan: 0,
    total_retur: 0,
    total_stock_masuk: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDate) return;
      
      setLoading(true);
      try {
        const result = await fetchDailySalesReport(selectedDate, branchId);
        setItems(result.items);
        setSummary(result.summary);
      } catch (error) {
        console.error('Error loading daily sales report:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Gagal memuat laporan harian"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, branchId, toast]);

  return { items, summary, loading };
};
