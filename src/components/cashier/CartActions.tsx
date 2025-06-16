
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, Printer } from 'lucide-react';

interface CartActionsProps {
  canProcessPayment: boolean;
  processingPayment: boolean;
  selectedBranch: string | null;
  cartLength: number;
  onPaymentClick: () => void;
  onPendingClick: () => void;
}

export const CartActions: React.FC<CartActionsProps> = ({
  canProcessPayment,
  processingPayment,
  selectedBranch,
  cartLength,
  onPaymentClick,
  onPendingClick
}) => {
  return (
    <div className="space-y-2">
      <Button 
        className="w-full"
        disabled={!canProcessPayment}
        onClick={onPaymentClick}
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {processingPayment ? 'Memproses...' : 'Pilih Pembayaran'}
      </Button>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline"
          className="w-full"
          disabled={!selectedBranch}
          onClick={onPendingClick}
        >
          <Clock className="mr-2 h-4 w-4" />
          Pending
        </Button>
        
        <Button 
          variant="outline"
          className="w-full"
          disabled={cartLength === 0}
        >
          <Printer className="mr-2 h-4 w-4" />
          Cetak
        </Button>
      </div>
    </div>
  );
};
