
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactionsFromDB } from '@/services/reports/transactionService';
import { transformTransactionData } from '@/utils/reportsUtils';
import type { Transaction, DateRange } from '@/types/reports';

export const useReportsData = (
  selectedBranch: string,
  dateRange: DateRange,
  paymentStatusFilter: string
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  const [branchAssignmentChecked, setBranchAssignmentChecked] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's actual branch untuk kasir_cabang dengan logic yang sama seperti kasir
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 [REPORTS] Fetching branch assignment for kasir:', user.id, user.email);
          
          // Menggunakan query yang sama dengan yang digunakan di kasir
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('❌ [REPORTS] Error fetching user branch:', error);
            setUserActualBranchId(null);
          } else if (userBranch?.branch_id) {
            console.log('✅ [REPORTS] Found branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ [REPORTS] Kasir user without branch assignment');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ [REPORTS] Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        } finally {
          setBranchAssignmentChecked(true);
        }
      } else {
        setBranchAssignmentChecked(true);
      }
    };

    fetchUserBranch();
  }, [user]);

  // Fetch transactions dengan validasi yang konsisten dengan kasir
  useEffect(() => {
    // Skip if not ready
    if (!user || !branchAssignmentChecked) {
      console.log('⏳ [REPORTS] Waiting for user or branch assignment check...');
      return;
    }

    // Untuk kasir_cabang, cek apakah ada branch assignment
    if (user.role === 'kasir_cabang') {
      console.log('👤 [REPORTS] Kasir user detected:', {
        userId: user.id,
        email: user.email,
        userActualBranchId,
        branchAssignmentChecked
      });
    }
    
    // Validasi date range dengan lebih ketat
    if (!dateRange?.start || !dateRange?.end || dateRange.start === '' || dateRange.end === '') {
      console.warn('⚠️ [REPORTS] Invalid or empty date range, skipping fetch:', dateRange);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Validasi format tanggal
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('⚠️ [REPORTS] Invalid date format, skipping fetch');
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        console.log('📊 [REPORTS] Starting reports data fetch with timezone info:', {
          userRole: user.role,
          userActualBranchId,
          selectedBranch,
          dateRange,
          paymentStatusFilter,
          currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dateRangeISO: {
            start: new Date(dateRange.start).toISOString(),
            end: new Date(dateRange.end).toISOString()
          }
        });

        // Panggil service dengan parameter yang tepat
        const rawData = await fetchTransactionsFromDB(
          user.role,
          userActualBranchId,
          selectedBranch,
          dateRange,
          paymentStatusFilter
        );

        console.log('📊 [REPORTS] Raw data received:', {
          count: Array.isArray(rawData) ? rawData.length : 0,
          sample: Array.isArray(rawData) && rawData.length > 0 ? {
            id: rawData[0].id,
            date: rawData[0].transaction_date,
            localDate: rawData[0].local_datetime || 'Not available'
          } : null
        });

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionData(safeRawData);
        
        console.log('📊 [REPORTS] Transformed transactions:', {
          count: transformedTransactions.length,
          sample: transformedTransactions[0] ? {
            id: transformedTransactions[0].id,
            date: transformedTransactions[0].transaction_date
          } : null
        });

        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          toast({
            title: "Data Berhasil Dimuat",
            description: `${transformedTransactions.length} transaksi berhasil dimuat untuk periode ${dateRange.start} - ${dateRange.end}.`,
          });
        } else {
          const periodText = `${dateRange.start} - ${dateRange.end}`;
          toast({
            title: "Tidak Ada Transaksi",
            description: `Tidak ada transaksi ditemukan untuk periode ${periodText}. Pastikan timezone dan filter sudah benar.`,
            variant: "default",
          });
        }

      } catch (error: any) {
        console.error('❌ [REPORTS] Error in fetchData:', error);
        
        const errorMessage = error.message || 'Gagal memuat data laporan';
        
        toast({
          variant: "destructive",
          title: "Error Memuat Laporan",
          description: errorMessage,
        });
        
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce untuk menghindari multiple calls
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user, userActualBranchId, branchAssignmentChecked, selectedBranch, dateRange, paymentStatusFilter, toast]);

  return {
    transactions,
    loading,
    userActualBranchId
  };
};
