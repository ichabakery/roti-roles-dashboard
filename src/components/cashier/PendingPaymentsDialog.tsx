
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, CreditCard, AlertTriangle } from 'lucide-react';

interface PendingTransaction {
  id: string;
  total_amount: number;
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
  payment_status: string;
  transaction_date: string;
  branches?: { name: string };
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

      setPendingTransactions(data || []);
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

  const getStatusBadge = (status: string, dueDate: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    
    if (isOverdue) {
      return <Badge variant="destructive">Jatuh Tempo</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'partial':
        return <Badge variant="outline">Sebagian</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
                {pendingTransactions.map((transaction) => {
                  const daysUntilDue = getDaysUntilDue(transaction.due_date);
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                  
                  return (
                    <Card 
                      key={transaction.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTransaction?.id === transaction.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      } ${isOverdue ? 'border-destructive' : ''}`}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">
                              ID: {transaction.id.substring(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          {getStatusBadge(transaction.payment_status, transaction.due_date)}
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>Rp {transaction.total_amount.toLocaleString('id-ID')}</span>
                          </div>
                          {transaction.amount_paid && (
                            <div className="flex justify-between">
                              <span>Dibayar:</span>
                              <span>Rp {transaction.amount_paid.toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium">
                            <span>Sisa:</span>
                            <span>Rp {(transaction.amount_remaining || transaction.total_amount).toLocaleString('id-ID')}</span>
                          </div>
                          {transaction.due_date && (
                            <div className="flex justify-between items-center">
                              <span>Jatuh Tempo:</span>
                              <span className={isOverdue ? 'text-destructive' : ''}>
                                {new Date(transaction.due_date).toLocaleDateString('id-ID')}
                                {daysUntilDue !== null && (
                                  <span className="ml-1">
                                    ({isOverdue ? `${Math.abs(daysUntilDue)} hari terlewat` : `${daysUntilDue} hari lagi`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Payment Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Form Pembayaran</h3>
            {selectedTransaction ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Detail Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ID Transaksi:</span>
                      <span>{selectedTransaction.id.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Transaksi:</span>
                      <span>Rp {selectedTransaction.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                    {selectedTransaction.amount_paid && (
                      <div className="flex justify-between">
                        <span>Sudah Dibayar:</span>
                        <span>Rp {selectedTransaction.amount_paid.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Sisa Pembayaran:</span>
                      <span>Rp {(selectedTransaction.amount_remaining || selectedTransaction.total_amount).toLocaleString('id-ID')}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div>
                    <Label>Jumlah Pembayaran</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={selectedTransaction.amount_remaining || selectedTransaction.total_amount}
                    />
                  </div>

                  <div>
                    <Label>Metode Pembayaran</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Tunai</option>
                      <option value="card">Kartu Kredit/Debit</option>
                      <option value="transfer">Transfer Bank</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>

                  <Button 
                    onClick={handlePayment}
                    disabled={!paymentAmount || loading}
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proses Pembayaran
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Pilih transaksi untuk memproses pembayaran
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
