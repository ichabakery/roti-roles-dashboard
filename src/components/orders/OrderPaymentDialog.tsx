import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CashReceivedInput } from '@/components/cashier/CashReceivedInput';
import { CreditCard, Banknote, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/services/orderService';

interface OrderPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onPaymentComplete: (updatedOrder: Order) => void;
}

export const OrderPaymentDialog: React.FC<OrderPaymentDialogProps> = ({
  open,
  onOpenChange,
  order,
  onPaymentComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [cashReceived, setCashReceived] = useState(0);
  const [cashChange, setCashChange] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Calculate remaining amount
  const totalAmount = order?.total_amount || 0;
  const dpPaid = order?.dp_amount || 0;
  const remainingAmount = order?.remaining_amount ?? (totalAmount - dpPaid);

  // Determine if it's DP payment or full/remaining payment
  const paymentType = order?.payment_type || 'cash_on_delivery';
  const isFirstPayment = !dpPaid || dpPaid === 0;
  
  // Handle cash received changes
  const handleCashReceivedChange = useCallback((received: number, change: number) => {
    setCashReceived(received);
    setCashChange(change);
  }, []);

  // Get effective payment amount
  const getEffectivePaymentAmount = () => {
    const parsed = parseFloat(paymentAmount);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(parsed, remainingAmount);
    }
    return remainingAmount;
  };

  const handleConfirmPayment = async () => {
    if (!order || !user) return;

    const amountToPay = getEffectivePaymentAmount();
    
    // Validate cash payment
    if (paymentMethod === 'cash' && cashReceived < amountToPay) {
      toast({
        variant: "destructive",
        title: "Uang diterima kurang",
        description: "Jumlah uang yang diterima kurang dari jumlah yang harus dibayar"
      });
      return;
    }

    setProcessing(true);
    try {
      const newAmountPaid = dpPaid + amountToPay;
      const newRemainingAmount = totalAmount - newAmountPaid;
      const isFullyPaid = newRemainingAmount <= 0;

      // Update order payment status
      const { data: updatedOrder, error: orderError } = await supabase
        .from('orders')
        .update({
          dp_amount: newAmountPaid,
          remaining_amount: Math.max(0, newRemainingAmount),
          payment_status: isFullyPaid ? 'paid' : 'partial',
          status: isFullyPaid ? 'completed' : order.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (orderError) throw orderError;

      // Build payment notes including cash received/change info
      let paymentNotes = notes || '';
      if (paymentMethod === 'cash' && cashReceived > 0) {
        const cashInfo = `Diterima: Rp ${cashReceived.toLocaleString('id-ID')}, Kembalian: Rp ${cashChange.toLocaleString('id-ID')}`;
        paymentNotes = paymentNotes ? `${paymentNotes}. ${cashInfo}` : cashInfo;
      }

      // Create a transaction record for admin/owner visibility
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          branch_id: order.branch_id,
          cashier_id: user.id,
          total_amount: amountToPay,
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'completed',
          amount_paid: amountToPay,
          amount_remaining: 0,
          notes: `Pembayaran pesanan ${order.order_number} - ${isFirstPayment ? 'DP' : 'Pelunasan'}. ${paymentNotes}`
        })
        .select()
        .single();

      if (txError) {
        console.error('Transaction creation error:', txError);
        // Don't throw, order update already succeeded
      }

      // If transaction created, link it to order and record items
      if (transaction) {
        // Link transaction to order
        await supabase
          .from('orders')
          .update({ linked_transaction_id: transaction.id })
          .eq('id', order.id);

        // Record transaction items from order items
        if (order.items && Array.isArray(order.items)) {
          const transactionItems = order.items.map((item: any) => ({
            transaction_id: transaction.id,
            product_id: item.productId,
            quantity: item.quantity,
            price_per_item: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }));

          await supabase
            .from('transaction_items')
            .insert(transactionItems);
        }

        // Record payment history
        await supabase
          .from('payment_history')
          .insert({
            transaction_id: transaction.id,
            amount_paid: amountToPay,
            payment_method: paymentMethod,
            cashier_id: user.id,
            notes: paymentNotes || null
          });
      }

      toast({
        title: "Pembayaran Berhasil",
        description: `Pembayaran Rp ${amountToPay.toLocaleString('id-ID')} untuk pesanan ${order.order_number} berhasil dicatat.`
      });

      // Parse items properly
      const parsedItems = typeof updatedOrder.items === 'string' 
        ? JSON.parse(updatedOrder.items) 
        : updatedOrder.items;

      onPaymentComplete({
        ...updatedOrder,
        items: parsedItems
      } as Order);
      
      // Reset and close
      resetForm();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Gagal memproses pembayaran",
        description: error.message || "Terjadi kesalahan saat memproses pembayaran"
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentMethod('cash');
    setPaymentAmount('');
    setNotes('');
    setCashReceived(0);
    setCashChange(0);
  };

  const isFormValid = () => {
    const amountToPay = getEffectivePaymentAmount();
    if (amountToPay <= 0) return false;
    if (paymentMethod === 'cash') {
      return cashReceived >= amountToPay;
    }
    return true;
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bayar Pesanan {order.order_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pesanan</span>
                <span className="font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {dpPaid > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Sudah Dibayar (DP)</span>
                  <span>Rp {dpPaid.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Sisa yang Harus Dibayar</span>
                <span className="text-primary">Rp {remainingAmount.toLocaleString('id-ID')}</span>
              </div>
              <Badge variant={remainingAmount <= 0 ? 'default' : 'secondary'}>
                {remainingAmount <= 0 ? 'Lunas' : paymentType === 'dp' ? 'Bayar DP' : 'Belum Lunas'}
              </Badge>
            </CardContent>
          </Card>

          {remainingAmount > 0 && (
            <>
              {/* Payment Amount (optional, defaults to remaining) */}
              <div className="space-y-2">
                <Label>Jumlah Pembayaran</Label>
                <Input
                  type="number"
                  placeholder={`Rp ${remainingAmount.toLocaleString('id-ID')} (sisa)`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={remainingAmount}
                />
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk bayar penuh sisa Rp {remainingAmount.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <span className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" /> Tunai
                      </span>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <span className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" /> Transfer Bank
                      </span>
                    </SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="card">Kartu Kredit/Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cash Input with Change Calculation */}
              {paymentMethod === 'cash' && (
                <CashReceivedInput
                  totalAmount={getEffectivePaymentAmount()}
                  onCashReceivedChange={handleCashReceivedChange}
                />
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Catatan (Opsional)</Label>
                <Textarea
                  placeholder="Catatan pembayaran..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Batal
                </Button>
                <Button 
                  onClick={handleConfirmPayment} 
                  disabled={!isFormValid() || processing}
                  className="flex-1"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Konfirmasi Pembayaran
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}

          {remainingAmount <= 0 && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-lg font-medium text-green-600">Pesanan Sudah Lunas</p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-4">
                Tutup
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};