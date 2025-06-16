
import React from 'react';

interface PaymentSummaryProps {
  totalAmount: number;
  paymentType: 'full' | 'deferred' | 'down_payment';
  downPaymentAmount?: string;
  dueDate?: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalAmount,
  paymentType,
  downPaymentAmount,
  dueDate
}) => {
  return (
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
  );
};
