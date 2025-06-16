
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentTypeSelector } from './PaymentTypeSelector';
import { PaymentFormFields } from './PaymentFormFields';
import { PaymentSummary } from './PaymentSummary';

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
