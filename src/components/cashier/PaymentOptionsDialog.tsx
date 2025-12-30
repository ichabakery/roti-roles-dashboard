
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentTypeSelector } from './PaymentTypeSelector';
import { PaymentFormFields } from './PaymentFormFields';
import { PaymentSummary } from './PaymentSummary';
import { CashReceivedInput } from './CashReceivedInput';

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
  received?: number;  // Uang yang diterima dari pelanggan
  change?: number;    // Kembalian
  discountAmount?: number; // Diskon yang diberikan
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
  const [cashReceived, setCashReceived] = useState(0);
  const [cashChange, setCashChange] = useState(0);

  // Handle cash received changes
  const handleCashReceivedChange = useCallback((received: number, change: number) => {
    setCashReceived(received);
    setCashChange(change);
  }, []);

  // Calculate the effective total for cash input (full payment or DP amount)
  const getEffectiveTotalForCash = () => {
    if (paymentType === 'down_payment') {
      return parseFloat(downPaymentAmount) || 0;
    }
    return totalAmount;
  };

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

    // Include cash received and change for cash payments
    if (paymentMethod === 'cash' && paymentType !== 'deferred') {
      paymentData.received = cashReceived;
      paymentData.change = cashChange;
    }

    onConfirmPayment(paymentData);
    onOpenChange(false);
    
    // Reset form
    setPaymentType('full');
    setDownPaymentAmount('');
    setDueDate('');
    setNotes('');
    setCashReceived(0);
    setCashChange(0);
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
      const validDP = dueDate !== '' && isValidDownPayment();
      // For cash DP, check if received >= DP amount
      if (paymentMethod === 'cash') {
        const dpAmount = parseFloat(downPaymentAmount) || 0;
        return validDP && cashReceived >= dpAmount;
      }
      return validDP;
    }
    // For full payment with cash, check if received >= total
    if (paymentMethod === 'cash') {
      return cashReceived >= totalAmount;
    }
    return true;
  };

  // Check if we should show cash input (cash payment and not deferred)
  const showCashInput = paymentMethod === 'cash' && paymentType !== 'deferred';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <PaymentTypeSelector
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
          />

          <PaymentFormFields
            paymentType={paymentType}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            downPaymentAmount={downPaymentAmount}
            onDownPaymentAmountChange={setDownPaymentAmount}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            notes={notes}
            onNotesChange={setNotes}
            totalAmount={totalAmount}
          />

          {/* Cash Received Input - Show for cash payments */}
          {showCashInput && (
            <CashReceivedInput
              totalAmount={getEffectiveTotalForCash()}
              onCashReceivedChange={handleCashReceivedChange}
            />
          )}

          <PaymentSummary
            totalAmount={totalAmount}
            paymentType={paymentType}
            downPaymentAmount={downPaymentAmount}
            dueDate={dueDate}
          />

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
