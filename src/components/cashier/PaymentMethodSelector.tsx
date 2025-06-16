
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentMethodSelectorProps {
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onPaymentMethodChange
}) => {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-1 block">Metode Pembayaran</label>
      <Select
        value={paymentMethod}
        onValueChange={onPaymentMethodChange}
      >
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
  );
};
