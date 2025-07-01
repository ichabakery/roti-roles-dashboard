
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchBranchesFromDB, fetchTransactionsFromDB } from '@/services/reportsService';
import { transformTransactionData } from '@/utils/reportsUtils';
import type { Branch, Transaction, DateRange } from '@/types/reports';

export const useReportsData = (
  selectedBranch: string,
  dateRange: DateRange,
  paymentStatusFilter: string
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's actual branch untuk kasir_cabang
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 Fetching branch assignment for kasir:', user.id);
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('❌ Error fetching user branch:', error);
            setUserActualBranchId(null);
            return;
          }
          
          if (userBranch?.branch_id) {
            console.log('✅ Found branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ Kasir user without branch assignment:', { 
              userId: user.id, 
              email: user.email 
            });
            setUserActualBranchId(null);
            
            // Show warning toast for missing branch assignment
            toast({
              title: "Perlu Assignment Cabang",
              description: "Akun kasir cabang Anda belum dikaitkan dengan cabang. Silakan hubungi administrator untuk mengatur assignment cabang.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('❌ Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      } else {
        setUserActualBranchId(null);
      }
    };

    fetchUserBranch();
  }, [user, toast]);

  // Fetch branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await fetchBranchesFromDB();
        setBranches(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('❌ Error loading branches:', error);
        setBranches([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal memuat data cabang: ${error.message}`,
        });
      }
    };
    
    loadBranches();
  }, [toast]);

  // Fetch transactions dengan validasi ketat
  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user, skipping fetch');
      setLoading(false);
      return;
    }
    
    // Validasi date range dengan ketat
    if (!dateRange?.start || !dateRange?.end) {
      console.warn('⚠️ Invalid date range, skipping fetch:', dateRange);
      setLoading(false);
      return;
    }

    // Validasi tanggal format
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('⚠️ Invalid date format, skipping fetch:', dateRange);
      setLoading(false);
      return;
    }

    // Untuk kasir_cabang, harus ada branch assignment
    if (user.role === 'kasir_cabang' && !userActualBranchId) {
      console.warn('⚠️ Kasir without branch assignment, skipping fetch');
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

        console.log('📈 Raw data received:', Array.isArray(rawData) ? rawData.length : 0, 'transactions');

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionData(safeRawData);
        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          const actualRevenue = transformedTransactions.reduce((sum, t) => {
            switch (t.payment_status) {
              case 'paid':
                return sum + t.total_amount;
              case 'partial':
                return sum + (t.amount_paid || 0);
              case 'pending':
              case 'cancelled':
                return sum;
              default:
                return sum + (t.amount_paid || t.total_amount);
            }
          }, 0);
          
          const paidCount = transformedTransactions.filter(t => t.payment_status === 'paid').length;
          const partialCount = transformedTransactions.filter(t => t.payment_status === 'partial').length;
          const pendingCount = transformedTransactions.filter(t => t.payment_status === 'pending').length;
          
          toast({
            title: "Data Laporan Dimuat",
            description: `${transformedTransactions.length} transaksi dimuat. Lunas: ${paidCount}, Cicilan: ${partialCount}, Pending: ${pendingCount}. Pendapatan: Rp ${actualRevenue.toLocaleString('id-ID')}`,
          });
        } else {
          const periodText = `${dateRange.start} - ${dateRange.end}`;
          const branchText = selectedBranch === 'all' ? 'semua cabang' : 'cabang yang dipilih';
          const statusText = paymentStatusFilter === 'all' ? 'semua status' : `status ${paymentStatusFilter}`;
          
          toast({
            title: "Tidak Ada Data Transaksi",
            description: `Tidak ada transaksi ditemukan untuk ${branchText} dengan ${statusText} pada periode ${periodText}.`,
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
  }, [user, userActualBranchId, selectedBranch, dateRange, paymentStatusFilter, toast]);

  return {
    transactions,
    branches,
    loading,
    userActualBranchId
  };
};
