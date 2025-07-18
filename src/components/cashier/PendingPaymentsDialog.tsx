
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PendingTransactionCard } from './PendingTransactionCard';
import { PaymentForm } from './PaymentForm';
import { usePendingTransactions } from '@/hooks/usePendingTransactions';

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
  status: string; // Added missing status property
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
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  
  const {
    pendingTransactions,
    loading,
    refetch: fetchPendingTransactions
  } = usePendingTransactions(branchId, open);

  // Create a proper callback function for onSelect
  const handleSelectTransaction = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
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
      setProcessing(true);
      console.log('💳 Processing payment with validation:', {
        transactionId: selectedTransaction.id,
        amount,
        paymentMethod,
        currentPaid: selectedTransaction.amount_paid,
        totalAmount: selectedTransaction.total_amount,
        remainingAmount
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User tidak terautentikasi');
      }

      // Calculate new payment totals
      const currentPaid = selectedTransaction.amount_paid || 0;
      const newTotalPaid = currentPaid + amount;
      const newRemainingAmount = selectedTransaction.total_amount - newTotalPaid;
      
      // Validate payment amount again
      if (newTotalPaid > selectedTransaction.total_amount) {
        throw new Error('Jumlah pembayaran melebihi sisa tagihan');
      }

      // Determine new payment status and transaction status
      const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';
      const newTransactionStatus = newRemainingAmount <= 0 ? 'completed' : 'pending';

      console.log('💰 Payment calculation:', {
        currentPaid,
        amount,
        newTotalPaid,
        newRemainingAmount,
        newPaymentStatus,
        newTransactionStatus
      });

      // Update transaction payment status and transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          amount_paid: newTotalPaid,
          amount_remaining: newRemainingAmount,
          payment_status: newPaymentStatus,
          status: newTransactionStatus // IMPORTANT: Update transaction status
        })
        .eq('id', selectedTransaction.id);

      if (updateError) {
        console.error('❌ Transaction update error:', updateError);
        throw updateError;
      }

      // Insert payment history
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          transaction_id: selectedTransaction.id,
          amount_paid: amount,
          payment_method: paymentMethod,
          cashier_id: user.id,
          notes: newRemainingAmount <= 0 
            ? `Pelunasan pembayaran sebesar Rp ${amount.toLocaleString('id-ID')}. Transaksi selesai.`
            : `Pembayaran cicilan sebesar Rp ${amount.toLocaleString('id-ID')}. Total sudah dibayar: Rp ${newTotalPaid.toLocaleString('id-ID')} dari Rp ${selectedTransaction.total_amount.toLocaleString('id-ID')}`
        });

      if (paymentError) {
        console.error('❌ Payment history error:', paymentError);
        throw paymentError;
      }

      // Verify the transaction was updated correctly
      const { data: updatedTransaction, error: verifyError } = await supabase
        .from('transactions')
        .select('amount_paid, amount_remaining, payment_status, status')
        .eq('id', selectedTransaction.id)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log('✅ Transaction updated correctly:', updatedTransaction);
      }

      const successMessage = newRemainingAmount <= 0 
        ? `Pembayaran berhasil diselesaikan! Transaksi telah lunas.`
        : `Pembayaran sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat. Total terbayar: Rp ${newTotalPaid.toLocaleString('id-ID')}`;

      toast({
        title: "Pembayaran Berhasil",
        description: successMessage,
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
      setProcessing(false);
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
                    onSelect={handleSelectTransaction}
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
              loading={processing}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
