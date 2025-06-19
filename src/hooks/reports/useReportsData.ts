
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

  // Fetch user's actual branch for kasir_cabang
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 Fetching actual branch for kasir_cabang:', user.id);
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
          
          if (userBranch) {
            console.log('✅ Found user branch:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ No branch assignment found for kasir_cabang');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      }
    };

    fetchUserBranch();
  }, [user]);

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

  // Fetch transactions
  useEffect(() => {
    if (!user) return;
    
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
            return sum + (t.payment_status === 'paid' ? t.total_amount : (t.amount_paid || 0));
          }, 0);
          
          toast({
            title: "Data Laporan Dimuat",
            description: `${transformedTransactions.length} transaksi berhasil dimuat. Pendapatan aktual: Rp ${actualRevenue.toLocaleString('id-ID')}`,
          });
        } else {
          if (
            user.role === 'kasir_cabang' &&
            (!userActualBranchId || userActualBranchId === '' || userActualBranchId === null)
          ) {
            toast({
              title: "Perlu Assignment Cabang",
              description: "Akun kasir cabang Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang agar dapat mengakses data transaksi.",
              variant: "destructive",
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
        }
      } catch (error: any) {
        console.error('❌ Error fetching reports data:', error);
        
        let errorMessage = error.message || 'Gagal memuat data laporan';
        
        if (user.role === 'kasir_cabang' && (!userActualBranchId || userActualBranchId === '' || userActualBranchId === null)) {
          errorMessage = 'Akun kasir cabang Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.';
        }
        
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
