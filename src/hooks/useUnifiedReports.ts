
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

  // Auto-set branch for kasir
  useEffect(() => {
    if (user?.role === 'kasir_cabang' && user.branchId && branches.length > 0) {
      setSelectedBranch(user.branchId);
    }
  }, [user, branches]);

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
        const rawData = await fetchTransactionsFromDB(
          user.role,
          user.branchId,
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
        }
      } catch (error: any) {
        console.error('Error fetching reports data:', error);
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

    fetchData();
  }, [user, selectedBranch, dateRange]);

  // Quick date range presets
  const setQuickDateRange = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setDateRange({ start, end });
  };

  // Get available branches based on user role
  const getAvailableBranches = () => {
    if (user?.role === 'kasir_cabang') {
      return branches.filter(branch => branch.id === user.branchId);
    }
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
