
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { fetchBranchesFromDB, fetchTransactionsFromDB } from '@/services/reportsService';
import { transformTransactionData, generateSummaries } from '@/utils/reportsUtils';
import type { Branch, Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary, DateRange } from '@/types/reports';

export const useReportsData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentMethodSummary[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBranches = async () => {
    try {
      const data = await fetchBranchesFromDB();
      setBranches(data);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };

  const fetchReportsData = async (selectedBranch: string, dateRange: DateRange) => {
    if (!user) return;
    
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
      
      const summaries = generateSummaries(transformedTransactions);
      setSummary(summaries.branchSummary);
      setProductSummary(summaries.productSummary);
      setPaymentSummary(summaries.paymentSummary);
      
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

  return {
    transactions,
    summary,
    productSummary,
    paymentSummary,
    branches,
    loading,
    fetchBranches,
    fetchReportsData
  };
};
