
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CreditCard, Wallet } from 'lucide-react';

interface PaymentOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirmPayment: (paymentData: PaymentData) => void;
}

export interface PaymentData {
  type: 'full' | 'deferred' | 'down_payment';
  paymentMethod: string;
  amountPaid?: number;
  dueDate?: string;
  notes?: string;
}

export const PaymentOptionsDialog: React.FC<PaymentOptionsDialogProps> = ({
  open,
  onOpenChange,
  totalAmount,
  onConfirmPayment
}) => {
  const [paymentType, setPaymentType] = useState<'full' | 'deferred' | 'down_payment'>('full');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    const paymentData: PaymentData = {
      type: paymentType,
      paymentMethod,
      notes: notes || undefined
    };

    if (paymentType === 'down_payment') {
      paymentData.amountPaid = parseFloat(downPaymentAmount);
      paymentData.dueDate = dueDate;
    } else if (paymentType === 'deferred') {
      paymentData.dueDate = dueDate;
    }

    onConfirmPayment(paymentData);
    onOpenChange(false);
    
    // Reset form
    setPaymentType('full');
    setDownPaymentAmount('');
    setDueDate('');
    setNotes('');
  };

  const isValidDownPayment = () => {
    if (paymentType !== 'down_payment') return true;
    const amount = parseFloat(downPaymentAmount);
    return amount > 0 && amount <= totalAmount;
  };

  const isFormValid = () => {
    if (paymentType === 'deferred') {
      return dueDate !== '';
    }
    if (paymentType === 'down_payment') {
      return dueDate !== '' && isValidDownPayment();
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Type Selection */}
          <div className="space-y-2">
            <Label>Jenis Pembayaran</Label>
            <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Bayar Penuh
                  </div>
                </SelectItem>
                <SelectItem value="deferred">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Pembayaran Tunda
                  </div>
                </SelectItem>
                <SelectItem value="down_payment">
                  <div className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" />
                    Down Payment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="card">Kartu Kredit/Debit</SelectItem>
                <SelectItem value="transfer">Transfer Bank</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Down Payment Amount */}
          {paymentType === 'down_payment' && (
            <div className="space-y-2">
              <Label>Jumlah Down Payment</Label>
              <Input
                type="number"
                placeholder="0"
                value={downPaymentAmount}
                onChange={(e) => setDownPaymentAmount(e.target.value)}
                min="0"
                max={totalAmount}
              />
              <p className="text-sm text-muted-foreground">
                Total: Rp {totalAmount.toLocaleString('id-ID')}
              </p>
              {downPaymentAmount && (
                <p className="text-sm">
                  Sisa: Rp {(totalAmount - parseFloat(downPaymentAmount || '0')).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          )}

          {/* Due Date */}
          {(paymentType === 'deferred' || paymentType === 'down_payment') && (
            <div className="space-y-2">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Textarea
              placeholder="Catatan tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-2">Ringkasan Pembayaran</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Transaksi:</span>
                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {paymentType === 'full' && (
                <div className="flex justify-between font-medium">
                  <span>Dibayar Sekarang:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {paymentType === 'deferred' && (
                <>
                  <div className="flex justify-between">
                    <span>Dibayar Sekarang:</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Sisa Pembayaran:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
              {paymentType === 'down_payment' && downPaymentAmount && (
                <>
                  <div className="flex justify-between">
                    <span>Down Payment:</span>
                    <span>Rp {parseFloat(downPaymentAmount).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Sisa Pembayaran:</span>
                    <span>Rp {(totalAmount - parseFloat(downPaymentAmount)).toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
              {dueDate && (
                <div className="flex justify-between">
                  <span>Jatuh Tempo:</span>
                  <span>{new Date(dueDate).toLocaleDateString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!isFormValid()}
              className="flex-1"
            >
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
