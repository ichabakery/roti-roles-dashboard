
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentFormFieldsProps {
  paymentType: 'full' | 'deferred' | 'down_payment';
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  downPaymentAmount: string;
  onDownPaymentAmountChange: (amount: string) => void;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  totalAmount: number;
}

export const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  paymentType,
  paymentMethod,
  onPaymentMethodChange,
  downPaymentAmount,
  onDownPaymentAmountChange,
  dueDate,
  onDueDateChange,
  notes,
  onNotesChange,
  totalAmount
}) => {
  return (
    <>
      {/* Payment Method */}
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
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
            onChange={(e) => onDownPaymentAmountChange(e.target.value)}
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
            onChange={(e) => onDueDateChange(e.target.value)}
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
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </>
  );
};
