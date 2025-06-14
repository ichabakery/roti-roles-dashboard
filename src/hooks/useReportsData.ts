
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
      console.log('🏪 Starting to fetch branches...');
      const data = await fetchBranchesFromDB();
      setBranches(data);
      console.log('✅ Branches loaded successfully:', data.length);
    } catch (error: any) {
      console.error('❌ Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };

  const fetchReportsData = async (selectedBranch: string, dateRange: DateRange) => {
    if (!user) {
      console.warn('⚠️ No user found, skipping reports fetch');
      return;
    }
    
    setLoading(true);
    console.log('📊 Starting reports data fetch for:', {
      user: user.email,
      role: user.role,
      branchId: user.branchId,
      selectedBranch,
      dateRange
    });
    
    try {
      const rawData = await fetchTransactionsFromDB(
        user.role,
        user.branchId,
        selectedBranch,
        dateRange
      );

      console.log('📈 Raw transaction data received:', rawData.length, 'records');

      const transformedTransactions = transformTransactionData(rawData);
      setTransactions(transformedTransactions);
      
      const summaries = generateSummaries(transformedTransactions);
      setSummary(summaries.branchSummary);
      setProductSummary(summaries.productSummary);
      setPaymentSummary(summaries.paymentSummary);
      
      console.log('✅ Reports data processed successfully:', {
        transactions: transformedTransactions.length,
        branchSummary: summaries.branchSummary.length,
        productSummary: summaries.productSummary.length,
        paymentSummary: summaries.paymentSummary.length
      });
      
      // Show success message if data is found
      if (transformedTransactions.length > 0) {
        toast({
          title: "Data Laporan Dimuat",
          description: `${transformedTransactions.length} transaksi berhasil dimuat untuk periode yang dipilih.`,
        });
      } else {
        toast({
          title: "Tidak Ada Data",
          description: "Tidak ada transaksi ditemukan untuk periode dan filter yang dipilih.",
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching reports data:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = error.message || 'Gagal memuat data laporan';
      
      if (error.message?.includes('belum dikaitkan dengan cabang')) {
        errorMessage = 'Akun Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.';
      } else if (error.message?.includes('Akses ditolak')) {
        errorMessage = `Akses ditolak untuk role ${user.role}. Silakan hubungi administrator.`;
      } else if (error.message?.includes('tidak memiliki akses')) {
        errorMessage = 'Anda tidak memiliki akses untuk melihat laporan ini.';
      }
      
      toast({
        variant: "destructive",
        title: "Error Memuat Laporan",
        description: errorMessage,
      });
      
      // Reset data on error
      setTransactions([]);
      setSummary([]);
      setProductSummary([]);
      setPaymentSummary([]);
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
