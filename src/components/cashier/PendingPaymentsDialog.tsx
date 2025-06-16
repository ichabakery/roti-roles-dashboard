
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
          branches (name)
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('due_date', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to ensure branches is properly typed
      const transformedData: PendingTransaction[] = (data || []).map(item => ({
        ...item,
        branches: Array.isArray(item.branches) && item.branches.length > 0 
          ? item.branches[0] 
          : item.branches || null
      }));

      setPendingTransactions(transformedData);
    } catch (error: any) {
      console.error('Error fetching pending transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat transaksi pending",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedTransaction || !paymentAmount) return;

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

      // Insert payment history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          transaction_id: selectedTransaction.id,
          amount_paid: amount,
          payment_method: paymentMethod,
          cashier_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat`,
      });

      // Refresh the list
      await fetchPendingTransactions();
      setSelectedTransaction(null);
      setPaymentAmount('');
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memproses pembayaran",
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
              <div className="text-center py-4">Loading...</div>
            ) : pendingTransactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Tidak ada transaksi pending
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
