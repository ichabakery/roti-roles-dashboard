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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Computed summaries with proper payment status handling
  const summaries = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    const filtered = safeTransactions.filter(transaction => {
      const matchesSearch = searchQuery === '' || 
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.branches?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
    
    console.log('🔍 Generating summaries with payment status consideration:', filtered.length);
    return generateSummariesWithPaymentStatus(filtered);
  }, [transactions, searchQuery]);

  // Enhanced summary generation that considers actual payment amounts
  const generateSummariesWithPaymentStatus = (data: Transaction[]) => {
    console.log('📊 Generating payment-aware summaries from', data.length, 'transactions');
    
    const branchSummaryMap = new Map<string, TransactionSummary>();
    const productSummaryMap = new Map<string, ProductSummary>();
    const paymentSummaryMap = new Map<string, PaymentMethodSummary>();

    data.forEach(transaction => {
      const branchId = transaction.branch_id;
      const branchName = transaction.branches?.name || 'Unknown Branch';

      // Calculate actual revenue based on payment status
      let actualRevenue = 0;
      switch (transaction.payment_status) {
        case 'paid':
          actualRevenue = transaction.total_amount;
          break;
        case 'partial':
          actualRevenue = transaction.amount_paid || 0;
          break;
        case 'pending':
          actualRevenue = 0; // No revenue until payment is made
          break;
        default:
          actualRevenue = transaction.total_amount;
      }

      console.log(`💰 Transaction ${transaction.id}: Status=${transaction.payment_status}, Total=${transaction.total_amount}, Paid=${transaction.amount_paid}, Actual Revenue=${actualRevenue}`);

      // Branch summary with actual revenue
      if (!branchSummaryMap.has(branchId)) {
        branchSummaryMap.set(branchId, {
          branch_id: branchId,
          branch_name: branchName,
          total_transactions: 0,
          total_revenue: 0,
          avg_transaction: 0
        });
      }

      const branchSummary = branchSummaryMap.get(branchId)!;
      branchSummary.total_transactions += 1;
      branchSummary.total_revenue += actualRevenue;

      // Payment method summary with actual amounts
      const paymentMethod = transaction.payment_method;
      if (!paymentSummaryMap.has(paymentMethod)) {
        paymentSummaryMap.set(paymentMethod, {
          payment_method: paymentMethod,
          count: 0,
          total_amount: 0
        });
      }

      const paymentSummary = paymentSummaryMap.get(paymentMethod)!;
      paymentSummary.count += 1;
      paymentSummary.total_amount += actualRevenue;

      // Product summary - only count revenue for paid/partial transactions
      if (transaction.payment_status !== 'pending') {
        transaction.transaction_items?.forEach(item => {
          if (!item.products || !item.product_id) {
            console.warn('⚠️ Invalid item in product summary:', item);
            return;
          }

          const productId = item.product_id;
          const productName = item.products.name || 'Unknown Product';

          if (!productSummaryMap.has(productId)) {
            productSummaryMap.set(productId, {
              product_id: productId,
              product_name: productName,
              total_quantity: 0,
              total_revenue: 0
            });
          }

          const productSummary = productSummaryMap.get(productId)!;
          productSummary.total_quantity += item.quantity;
          
          // Calculate proportional revenue for partial payments
          const itemRevenue = transaction.payment_status === 'partial' 
            ? (item.subtotal * (actualRevenue / transaction.total_amount))
            : item.subtotal;
          
          productSummary.total_revenue += itemRevenue;
        });
      }
    });

    // Calculate average transaction amounts
    const branchSummaryArray = Array.from(branchSummaryMap.values()).map(summary => ({
      ...summary,
      avg_transaction: summary.total_transactions > 0 ? summary.total_revenue / summary.total_transactions : 0
    }));

    console.log('✅ Generated payment-aware summaries:', {
      branches: branchSummaryArray.length,
      products: productSummaryMap.size,
      payments: paymentSummaryMap.size,
      totalActualRevenue: branchSummaryArray.reduce((sum, branch) => sum + branch.total_revenue, 0)
    });

    return {
      branchSummary: branchSummaryArray,
      productSummary: Array.from(productSummaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue),
      paymentSummary: Array.from(paymentSummaryMap.values()).sort((a, b) => b.total_amount - a.total_amount)
    };
  };

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

  // Fetch transactions with enhanced payment status validation
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('📊 Fetching reports data with payment validation:', {
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

        console.log('📈 Raw data with payment details:', Array.isArray(rawData) ? rawData.length : 0, 'transactions');

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionDataWithPaymentValidation(safeRawData);
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

  // Enhanced transaction data transformation with payment validation
  const transformTransactionDataWithPaymentValidation = (rawData: any[]): Transaction[] => {
    console.log('🔄 Transforming transaction data with payment validation:', rawData.length, 'records');
    
    return rawData.map(item => {
      // Validate payment data consistency
      const total_amount = typeof item.total_amount === 'number' ? item.total_amount : 0;
      const amount_paid = typeof item.amount_paid === 'number' ? item.amount_paid : null;
      const amount_remaining = typeof item.amount_remaining === 'number' ? item.amount_remaining : null;
      const payment_status = item.payment_status || 'paid';

      // Validate payment consistency
      if (payment_status === 'partial' && amount_paid) {
        const calculatedRemaining = total_amount - amount_paid;
        if (Math.abs(calculatedRemaining - (amount_remaining || 0)) > 0.01) {
          console.warn(`⚠️ Payment inconsistency detected for transaction ${item.id}:`, {
            total: total_amount,
            paid: amount_paid,
            remaining: amount_remaining,
            calculated: calculatedRemaining
          });
        }
      }

      
      const cashier_name = item.cashier_name ?? 
        (item.profiles?.name ?? "Kasir");

      const transaction_items = (item.transaction_items || [])
        .filter((ti: any) => ti && ti.products)
        .map((ti: any) => {
          const quantity = typeof ti.quantity === 'number' ? ti.quantity : 0;
          const price_per_item = typeof ti.price_per_item === 'number' ? ti.price_per_item : 0;
          const subtotal = typeof ti.subtotal === 'number' ? ti.subtotal : 0;
          
          return {
            id: ti.id,
            product_id: ti.product_id,
            quantity,
            price_per_item,
            subtotal,
            products: {
              id: ti.products.id,
              name: ti.products.name || "Produk Tidak Dikenal",
              description: ti.products.description
            }
          };
        });

      const transformed = {
        id: item.id,
        branch_id: item.branch_id,
        cashier_id: item.cashier_id,
        transaction_date: item.transaction_date,
        total_amount,
        amount_paid,
        amount_remaining,
        payment_status,
        payment_method: item.payment_method || 'cash',
        branches: item.branches || { id: item.branch_id, name: 'Unknown Branch' },
        transaction_items,
        cashier_name,
        received: item.received,
        change: item.change,
      };

      console.log('✅ Validated transaction:', {
        id: transformed.id,
        status: transformed.payment_status,
        total: transformed.total_amount,
        paid: transformed.amount_paid,
        remaining: transformed.amount_remaining
      });
      
      return transformed;
    });
  };

  // Quick date range presets
  const setQuickDateRange = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
    setDateRange({ start, end });
  };

  // Get available branches based on user role and actual branch
  const getAvailableBranches = () => {
    const safeBranches = Array.isArray(branches) ? branches : [];
    
    if (user?.role === 'kasir_cabang') {
      const userBranch = safeBranches.filter(branch => branch.id === userActualBranchId);
      console.log('📍 Available branches for kasir_cabang:', userBranch);
      return userBranch;
    }
    console.log('🌍 Available branches for', user?.role, ':', safeBranches.length, 'branches');
    return safeBranches;
  };

  const isBranchSelectionDisabled = user?.role === 'kasir_cabang';

  return {
    transactions: Array.isArray(transactions) ? transactions : [],
    branches: Array.isArray(branches) ? branches : [],
    loading,
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
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
