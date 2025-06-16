
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface PendingTransaction {
  id: string;
  total_amount: number;
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
  payment_status: string;
  transaction_date: string;
  branches?: { name: string } | null;
  payment_method: string;
}

interface PaymentFormProps {
  selectedTransaction: PendingTransaction | null;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  onPayment: () => void;
  loading: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedTransaction,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  loading
}) => {
  if (!selectedTransaction) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Pilih transaksi untuk memproses pembayaran
      </div>
    );
  }

  return (
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
          onClick={onPayment}
          disabled={!paymentAmount || loading}
          className="w-full"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Proses Pembayaran
        </Button>
      </div>
    </div>
  );
};
