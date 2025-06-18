import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PendingTransactionCard } from './PendingTransactionCard';
import { PaymentForm } from './PaymentForm';

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
}

interface PendingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
}

export const PendingPaymentsDialog: React.FC<PendingPaymentsDialogProps> = ({
  open,
  onOpenChange,
  branchId
}) => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPendingTransactions();
    }
  }, [open, branchId]);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pending transactions for branch:', branchId);
      
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

  const handlePayment = async () => {
    if (!selectedTransaction || !paymentAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pilih transaksi dan masukkan jumlah pembayaran",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    const remainingAmount = selectedTransaction.amount_remaining || selectedTransaction.total_amount;
    
    if (amount <= 0 || amount > remainingAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Jumlah pembayaran tidak valid",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('💳 Processing payment:', {
        transactionId: selectedTransaction.id,
        amount,
        paymentMethod
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User tidak terautentikasi');
      }

      // Insert payment history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          transaction_id: selectedTransaction.id,
          amount_paid: amount,
          payment_method: paymentMethod,
          cashier_id: user.id,
          notes: `Pembayaran cicilan sebesar Rp ${amount.toLocaleString('id-ID')}`
        });

      if (paymentError) {
        console.error('❌ Payment error:', paymentError);
        throw paymentError;
      }

      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`,
      });

      // Refresh the list
      await fetchPendingTransactions();
      setSelectedTransaction(null);
      setPaymentAmount('');
      
    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memproses pembayaran: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaksi Pembayaran Pending</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Transaction List */}
          <div className="space-y-3">
            <h3 className="font-medium">Daftar Transaksi Pending</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Memuat transaksi...</p>
              </div>
            ) : pendingTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">Tidak ada transaksi pending</p>
                <p className="text-sm mt-1">Semua transaksi sudah lunas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingTransactions.map((transaction) => (
                  <PendingTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    isSelected={selectedTransaction?.id === transaction.id}
                    onSelect={setSelectedTransaction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Payment Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Form Pembayaran</h3>
            <PaymentForm
              selectedTransaction={selectedTransaction}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onPayment={handlePayment}
              loading={loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
