
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchBranchesFromDB, fetchTransactionsFromDB } from '@/services/reportsService';
import { transformTransactionData, generateSummaries } from '@/utils/reportsUtils';
import type { Branch, Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary, DateRange } from '@/types/reports';

export const useUnifiedReports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Computed summaries
  const summaries = useMemo(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = searchQuery === '' || 
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.branches?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
    
    return generateSummaries(filtered);
  }, [transactions, searchQuery]);

  // Fetch user's actual branch for kasir_cabang
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 Fetching actual branch for kasir_cabang:', user.id);
          const { data: userBranch } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .single();
          
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

  // Auto-set branch for kasir using actual branch ID
  useEffect(() => {
    if (user?.role === 'kasir_cabang' && userActualBranchId && branches.length > 0) {
      console.log('🏪 Auto-selecting actual branch for kasir_cabang:', userActualBranchId);
      setSelectedBranch(userActualBranchId);
    } else if ((user?.role === 'owner' || user?.role === 'admin_pusat' || user?.role === 'kepala_produksi') && branches.length > 0) {
      if (selectedBranch === 'all' || !branches.find(b => b.id === selectedBranch)) {
        console.log('🌐 Setting default to all branches for role:', user?.role);
        setSelectedBranch('all');
      }
    }
  }, [user, userActualBranchId, branches]);

  // Fetch branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await fetchBranchesFromDB();
        setBranches(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal memuat data cabang: ${error.message}`,
        });
      }
    };
    
    loadBranches();
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('📊 Fetching reports data with params:', {
          userRole: user.role,
          userActualBranchId,
          selectedBranch,
          dateRange
        });

        const rawData = await fetchTransactionsFromDB(
          user.role,
          userActualBranchId, // Use actual branch ID for kasir_cabang
          selectedBranch,
          dateRange
        );

        const transformedTransactions = transformTransactionData(rawData);
        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          toast({
            title: "Data Laporan Dimuat",
            description: `${transformedTransactions.length} transaksi berhasil dimuat.`,
          });
        } else {
          // Enhanced feedback for different scenarios
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
            
            toast({
              title: "Tidak Ada Data Transaksi",
              description: `Tidak ada transaksi ditemukan untuk ${branchText} pada periode ${periodText}. Pastikan data transaksi tersedia untuk periode ini.`,
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

    fetchData();
  }, [user, userActualBranchId, selectedBranch, dateRange]);

  // Quick date range presets
  const setQuickDateRange = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setDateRange({ start, end });
  };

  // Get available branches based on user role and actual branch
  const getAvailableBranches = () => {
    if (user?.role === 'kasir_cabang') {
      const userBranch = branches.filter(branch => branch.id === userActualBranchId);
      console.log('📍 Available branches for kasir_cabang:', userBranch);
      return userBranch;
    }
    console.log('🌍 Available branches for', user?.role, ':', branches.length, 'branches');
    return branches;
  };

  const isBranchSelectionDisabled = user?.role === 'kasir_cabang';

  return {
    transactions,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    summaries,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir: user?.role === 'kasir_cabang'
  };
};
