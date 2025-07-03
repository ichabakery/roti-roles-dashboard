
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactionsFromDB } from '@/services/reportsService';
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

  // Fetch user's actual branch untuk kasir_cabang
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 Fetching branch assignment for kasir:', user.id);
          const { data: userBranch } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userBranch?.branch_id) {
            console.log('✅ Found branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ Kasir user without branch assignment');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ Failed to fetch user branch:', error);
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

  // Fetch transactions dengan validasi yang lebih baik
  useEffect(() => {
    // Skip if not ready
    if (!user || !branchAssignmentChecked) {
      console.log('⏳ Waiting for user or branch assignment check...');
      return;
    }

    // Validasi untuk kasir_cabang
    if (user.role === 'kasir_cabang' && !userActualBranchId) {
      console.warn('⚠️ Kasir cabang without branch assignment');
      setTransactions([]);
      setLoading(false);
      toast({
        title: "Perlu Assignment Cabang",
        description: "Akun kasir cabang Anda belum dikaitkan dengan cabang.",
        variant: "destructive",
      });
      return;
    }
    
    // Validasi date range
    if (!dateRange?.start || !dateRange?.end) {
      console.warn('⚠️ Invalid date range, skipping fetch:', dateRange);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Validasi tanggal tidak kosong
    if (dateRange.start === '' || dateRange.end === '') {
      console.warn('⚠️ Empty date range values, skipping fetch');
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        console.log('📊 Starting reports data fetch:', {
          userRole: user.role,
          userActualBranchId,
          selectedBranch,
          dateRange,
          paymentStatusFilter
        });

        const rawData = await fetchTransactionsFromDB(
          user.role,
          userActualBranchId,
          selectedBranch,
          dateRange,
          paymentStatusFilter
        );

        console.log('📊 Raw data received:', {
          count: Array.isArray(rawData) ? rawData.length : 0,
          sample: Array.isArray(rawData) ? rawData[0] : null
        });

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionData(safeRawData);
        
        console.log('📊 Transformed transactions:', {
          count: transformedTransactions.length,
          sample: transformedTransactions[0]
        });

        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          toast({
            title: "Data Berhasil Dimuat",
            description: `${transformedTransactions.length} transaksi berhasil dimuat.`,
          });
        } else {
          toast({
            title: "Tidak Ada Transaksi",
            description: "Tidak ada transaksi ditemukan untuk periode yang dipilih.",
            variant: "default",
          });
        }

      } catch (error: any) {
        console.error('❌ Error in fetchData:', error);
        
        // Show user-friendly error message
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
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, userActualBranchId, branchAssignmentChecked, selectedBranch, dateRange, paymentStatusFilter, toast]);

  return {
    transactions,
    loading,
    userActualBranchId
  };
};
