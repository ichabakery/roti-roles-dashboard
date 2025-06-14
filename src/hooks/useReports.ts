
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  name: string;
}

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
  products?: {
    name: string;
  };
}

interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  branches: Branch;
  transaction_items?: TransactionItem[];
}

interface TransactionSummary {
  branch_id: string;
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
}

interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface PaymentMethodSummary {
  payment_method: string;
  count: number;
  total_amount: number;
}

export const useReports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentMethodSummary[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    // For kasir role, auto-select their branch
    if (user?.role === 'kasir_cabang' && user.branchId && branches.length > 0) {
      setSelectedBranch(user.branchId);
    }
  }, [user, branches]);

  useEffect(() => {
    fetchReportsData();
  }, [selectedBranch, dateRange, user]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };

  const fetchReportsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Fetching reports data for user:', user.role, 'selectedBranch:', selectedBranch);

      // Build query based on user role and selected branch
      let transactionQuery = supabase
        .from('transactions')
        .select(`
          id,
          branch_id,
          cashier_id,
          transaction_date,
          total_amount,
          payment_method,
          branches!fk_transactions_branch_id (id, name),
          transaction_items (
            id,
            product_id,
            quantity,
            price_per_item,
            subtotal,
            products!fk_transaction_items_product_id (name)
          )
        `);

      // Apply role-based filtering
      if (user.role === 'kasir_cabang' && user.branchId) {
        transactionQuery = transactionQuery.eq('branch_id', user.branchId);
        console.log('Filtering for kasir branch:', user.branchId);
      } else if (selectedBranch !== 'all') {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
        console.log('Filtering for selected branch:', selectedBranch);
      }

      // Apply date range filter
      transactionQuery = transactionQuery
        .gte('transaction_date', dateRange.start + 'T00:00:00')
        .lte('transaction_date', dateRange.end + 'T23:59:59')
        .order('transaction_date', { ascending: false });

      console.log('Executing transaction query...');
      const { data: transactionData, error } = await transactionQuery;

      if (error) {
        console.error('Transaction query error:', error);
        throw error;
      }

      console.log('Transaction data received:', transactionData?.length, 'records');

      // Transform the data to match Transaction interface
      const transformedTransactions = (transactionData || []).map(item => {
        const transformed = {
          id: item.id,
          branch_id: item.branch_id,
          cashier_id: item.cashier_id,
          transaction_date: item.transaction_date,
          total_amount: item.total_amount,
          payment_method: item.payment_method,
          branches: item.branches || { id: '', name: 'Unknown Branch' },
          transaction_items: (item.transaction_items || []).map(ti => ({
            id: ti.id,
            product_id: ti.product_id,
            quantity: ti.quantity,
            price_per_item: ti.price_per_item,
            subtotal: ti.subtotal,
            products: ti.products || { name: 'Unknown Product' }
          }))
        };
        
        console.log('Transformed transaction:', transformed.id, 'branch:', transformed.branches.name);
        return transformed;
      });

      setTransactions(transformedTransactions);
      
      // Generate summaries
      generateSummaries(transformedTransactions);
      
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data laporan: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSummaries = (data: Transaction[]) => {
    console.log('Generating summaries from', data.length, 'transactions');
    
    // Branch summary
    const branchSummaryMap = new Map<string, TransactionSummary>();
    const productSummaryMap = new Map<string, ProductSummary>();
    const paymentSummaryMap = new Map<string, PaymentMethodSummary>();

    data.forEach(transaction => {
      const branchId = transaction.branch_id;
      const branchName = transaction.branches?.name || 'Unknown Branch';

      // Branch summary
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
      branchSummary.total_revenue += transaction.total_amount;

      // Payment method summary
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
      paymentSummary.total_amount += transaction.total_amount;

      // Product summary
      transaction.transaction_items?.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';

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
        productSummary.total_revenue += item.subtotal;
      });
    });

    // Calculate average transaction amounts
    const branchSummaryArray = Array.from(branchSummaryMap.values()).map(summary => ({
      ...summary,
      avg_transaction: summary.total_transactions > 0 ? summary.total_revenue / summary.total_transactions : 0
    }));

    console.log('Generated summaries:', {
      branches: branchSummaryArray.length,
      products: productSummaryMap.size,
      payments: paymentSummaryMap.size
    });

    setSummary(branchSummaryArray);
    setProductSummary(Array.from(productSummaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue));
    setPaymentSummary(Array.from(paymentSummaryMap.values()).sort((a, b) => b.total_amount - a.total_amount));
  };

  const getTotalRevenue = () => summary.reduce((total, item) => total + item.total_revenue, 0);
  const getTotalTransactions = () => summary.reduce((total, item) => total + item.total_transactions, 0);
  const getAverageTransaction = () => {
    const total = getTotalRevenue();
    const count = getTotalTransactions();
    return count > 0 ? total / count : 0;
  };

  return {
    transactions,
    summary,
    productSummary,
    paymentSummary,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    fetchReportsData,
    getTotalRevenue,
    getTotalTransactions,
    getAverageTransaction
  };
};
