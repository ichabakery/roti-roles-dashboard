
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
          console.log('🔍 Fetching branch assignment for kasir:', user.id, user.email);
          
          // Menggunakan query yang sama dengan yang digunakan di kasir
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('❌ Error fetching user branch:', error);
            setUserActualBranchId(null);
          } else if (userBranch?.branch_id) {
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

  // Fetch transactions dengan validasi yang konsisten dengan kasir
  useEffect(() => {
    // Skip if not ready
    if (!user || !branchAssignmentChecked) {
      console.log('⏳ Waiting for user or branch assignment check...');
      return;
    }

    // Untuk kasir_cabang, cek apakah ada branch assignment
    // TAPI jangan langsung blok - biarkan service yang handle
    if (user.role === 'kasir_cabang') {
      console.log('👤 Kasir user detected:', {
        userId: user.id,
        email: user.email,
        userActualBranchId,
        branchAssignmentChecked
      });
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

        // Panggil service dengan parameter yang tepat
        // Service akan handle pengecekan branch assignment secara internal
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
