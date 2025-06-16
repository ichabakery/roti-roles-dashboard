
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, CreditCard, Wallet } from 'lucide-react';

interface PaymentTypeSelectorProps {
  paymentType: 'full' | 'deferred' | 'down_payment';
  onPaymentTypeChange: (type: 'full' | 'deferred' | 'down_payment') => void;
}

export const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  paymentType,
  onPaymentTypeChange
}) => {
  return (
    <div className="space-y-2">
      <Label>Jenis Pembayaran</Label>
      <Select value={paymentType} onValueChange={(value: any) => onPaymentTypeChange(value)}>
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
  );
};
