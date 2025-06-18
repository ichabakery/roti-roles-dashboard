
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingTransaction {
  id: string;
  total_amount: number;
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
  payment_status: string;
  transaction_date: string;
  branches?: { name: string } | null;
  payment_method: string;
  branch_id: string;
}

export const usePendingTransactions = (branchId?: string, shouldFetch: boolean = true) => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingTransactions = async () => {
    if (!shouldFetch) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching pending transactions for branch:', branchId);
      
      // First, fetch transactions without branch relation to avoid relationship issues
      let query = supabase
        .from('transactions')
        .select(`
          id,
          total_amount,
          amount_paid,
          amount_remaining,
          due_date,
          payment_status,
          transaction_date,
          payment_method,
          branch_id
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('transaction_date', { ascending: false });

      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId);
      }

      const { data: transactionData, error } = await query;

      if (error) {
        console.error('❌ Error fetching pending transactions:', error);
        throw error;
      }

      console.log('✅ Pending transactions fetched:', transactionData?.length || 0);

      if (!transactionData || transactionData.length === 0) {
        setPendingTransactions([]);
        toast({
          title: "Info",
          description: "Tidak ada transaksi pembayaran pending saat ini",
        });
        return;
      }

      // Fetch branch names separately to avoid relationship issues
      const branchIds = [...new Set(transactionData.map(t => t.branch_id))];
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .in('id', branchIds);

      if (branchError) {
        console.error('❌ Error fetching branches:', branchError);
      }

      // Transform the data to include branch information
      const transformedData: PendingTransaction[] = transactionData.map(transaction => ({
        ...transaction,
        branches: branchData?.find(b => b.id === transaction.branch_id) 
          ? { name: branchData.find(b => b.id === transaction.branch_id)!.name }
          : null
      }));

      setPendingTransactions(transformedData);
      
    } catch (error: any) {
      console.error('❌ Error fetching pending transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat transaksi pending: ${error.message}`,
      });
      setPendingTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransactions();
  }, [branchId, shouldFetch]);

  return {
    pendingTransactions,
    loading,
    refetch: fetchPendingTransactions
  };
};
