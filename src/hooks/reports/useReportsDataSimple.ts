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

  // Fetch transactions dengan validasi ketat
  useEffect(() => {
    // Skip fetch if user or filters are not ready
    if (!user || !branchAssignmentChecked) {
      return;
    }

    // Show warning for kasir without branch assignment
    if (user.role === 'kasir_cabang' && !userActualBranchId) {
      setTransactions([]);
      setLoading(false);
      toast({
        title: "Perlu Assignment Cabang",
        description: "Akun kasir cabang Anda belum dikaitkan dengan cabang.",
        variant: "destructive",
      });
      return;
    }
    
    // Validasi date range dengan ketat
    if (!dateRange?.start || !dateRange?.end || dateRange.start === '' || dateRange.end === '') {
      console.warn('⚠️ Invalid or empty date range, skipping fetch:', dateRange);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('📊 Fetching reports data:', {
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

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionData(safeRawData);
        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          toast({
            title: "Data Laporan Dimuat",
            description: `${transformedTransactions.length} transaksi berhasil dimuat.`,
          });
        } else {
          toast({
            title: "Tidak Ada Data Transaksi",
            description: `Tidak ada transaksi ditemukan untuk periode yang dipilih.`,
            variant: "default",
          });
        }
      } catch (error: any) {
        console.error('❌ Error fetching reports data:', error);
        toast({
          variant: "destructive",
          title: "Error Memuat Laporan",
          description: error.message || 'Gagal memuat data laporan',
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