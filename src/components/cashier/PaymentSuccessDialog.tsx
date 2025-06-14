
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  status: string;
}

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Tunai';
    case 'card': return 'Kartu Kredit/Debit';
    case 'transfer': return 'Transfer Bank';
    case 'qris': return 'QRIS';
    default: return method;
  }
};

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onOpenChange,
  transaction
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            Pembayaran Berhasil
          </DialogTitle>
          <DialogDescription>
            Transaksi telah berhasil diproses
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg">
          <p className="font-medium">ID Transaksi: {transaction?.id.substring(0, 8)}...</p>
          <p>Total: Rp {transaction?.total_amount.toLocaleString('id-ID')}</p>
          <p>Metode: {getPaymentMethodLabel(transaction?.payment_method || '')}</p>
          <p>Waktu: {transaction ? new Date(transaction.transaction_date).toLocaleString('id-ID') : ''}</p>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Tutup
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              toast({
                title: "Cetak Nota",
                description: "Nota sedang dicetak...",
              });
            }}
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            Cetak Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
