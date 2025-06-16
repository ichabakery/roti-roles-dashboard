
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

    // Fix: Get the actual branchId from user_branches table for kasir_cabang
    let userBranchId = user.branchId;
    if (user.role === 'kasir_cabang') {
      try {
        const { data: userBranch } = await supabase
          .from('user_branches')
          .select('branch_id')
          .eq('user_id', user.id)
          .single();
        
        if (userBranch) {
          userBranchId = userBranch.branch_id;
        }
      } catch (error) {
        console.error('Failed to fetch user branch:', error);
      }
    }
    
    setLoading(true);
    console.log('📊 ===== REPORTS DATA FETCH START =====');
    console.log('📊 Fetch parameters:', {
      userEmail: user.email,
      userRole: user.role,
      userBranchId: userBranchId,
      selectedBranch,
      dateRange,
      timestamp: new Date().toISOString()
    });
    
    try {
      const rawData = await fetchTransactionsFromDB(
        user.role,
        userBranchId,
        selectedBranch,
        dateRange
      );

      console.log('📈 Raw transaction data received:', {
        recordCount: rawData.length,
        firstRecord: rawData[0] || null
      });

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
      
      // Enhanced feedback
      if (transformedTransactions.length > 0) {
        toast({
          title: "Data Laporan Dimuat",
          description: `${transformedTransactions.length} transaksi berhasil dimuat untuk periode yang dipilih.`,
        });
      } else {
        // Special: cek kasir tanpa assignment, tapi only jika branchId undefined/null!
        if (
          user.role === 'kasir_cabang' &&
          (!userBranchId || userBranchId === '' || userBranchId === null)
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
        
        console.log('📋 No data found - debugging info:', {
          selectedBranch,
          dateRange,
          userRole: user.role,
          userBranchId: userBranchId,
          hasRequiredBranchAssignment: user.role !== 'kasir_cabang' || !!userBranchId
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching reports data:', error);
      
      let errorMessage = error.message || 'Gagal memuat data laporan';
      
      // Show only for kasir_cabang jika benar-benar tidak ada branchId
      if (user.role === 'kasir_cabang' && (!userBranchId || userBranchId === '' || userBranchId === null)) {
        errorMessage = 'Akun kasir cabang Anda belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.';
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
      console.log('📊 ===== REPORTS DATA FETCH END =====');
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
