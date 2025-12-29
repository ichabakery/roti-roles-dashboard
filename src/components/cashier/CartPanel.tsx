
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CartItemsList } from './CartItemsList';
import { BranchSelector } from './BranchSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentOptionsDialog, PaymentData } from './PaymentOptionsDialog';
import { PendingPaymentsDialog } from './PendingPaymentsDialog';
import { CashReceivedInput } from './CashReceivedInput';
import { CartItem } from '@/types/cashier';
import { Branch } from '@/types/inventory';

interface CartPanelProps {
  cart: CartItem[];
  userRole?: string;
  branches: Branch[];
  selectedBranch: string | null;
  onBranchChange: (branchId: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProcessPayment: (paymentData?: PaymentData) => void;
  calculateTotal: () => number;
  branchError?: string;
  processingPayment: boolean;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  userRole,
  branches,
  selectedBranch,
  onBranchChange,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQuantity,
  onRemoveFromCart,
  onProcessPayment,
  calculateTotal,
  branchError,
  processingPayment
}) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [cashReceived, setCashReceived] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  const totalAmount = calculateTotal();
  const isCashPayment = paymentMethod === 'cash';
  const isInsufficientCash = isCashPayment && cashReceived > 0 && cashReceived < totalAmount;
  const needsCashInput = isCashPayment && cashReceived < totalAmount;
  const isDisabled = cart.length === 0 || !selectedBranch || processingPayment || (isCashPayment && needsCashInput);

  const handleCashReceivedChange = useCallback((received: number, change: number) => {
    setCashReceived(received);
    setChangeAmount(change);
  }, []);

  const handleQuickPayment = () => {
    // Include cash received and change in payment data
    const paymentData: PaymentData = {
      type: 'full',
      paymentMethod,
      received: cashReceived,
      change: changeAmount
    };
    onProcessPayment(paymentData);
  };

  const handleAdvancedPayment = () => {
    setShowPaymentOptions(true);
  };

  const handlePaymentConfirm = (paymentData: PaymentData) => {
    // Include cash received and change if cash payment
    if (isCashPayment) {
      paymentData.received = cashReceived;
      paymentData.change = changeAmount;
    }
    onProcessPayment(paymentData);
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Keranjang Belanja</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPendingPayments(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              Transaksi Pending
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Branch Selector for non-kasir roles */}
          {userRole !== 'kasir_cabang' && (
            <BranchSelector
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={onBranchChange}
            />
          )}

          {/* Branch Error Alert */}
          {branchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{branchError}</AlertDescription>
            </Alert>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            <CartItemsList
              cart={cart}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveFromCart={onRemoveFromCart}
            />
          </div>

          {/* Payment Method */}
          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={onPaymentMethodChange}
          />

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-medium">Total:</span>
              <span className="text-xl font-bold">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Cash Received Input - Only for cash payments */}
            {isCashPayment && cart.length > 0 && (
              <div className="mb-4">
                <CashReceivedInput
                  totalAmount={totalAmount}
                  onCashReceivedChange={handleCashReceivedChange}
                  disabled={processingPayment || !selectedBranch}
                />
              </div>
            )}

            {/* Payment Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleQuickPayment}
                disabled={isDisabled}
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {processingPayment ? 'Memproses...' : 'Bayar Sekarang'}
              </Button>
              
              <Button
                onClick={handleAdvancedPayment}
                disabled={isDisabled}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Opsi Pembayaran Lanjutan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options Dialog */}
      <PaymentOptionsDialog
        open={showPaymentOptions}
        onOpenChange={setShowPaymentOptions}
        totalAmount={totalAmount}
        onConfirmPayment={handlePaymentConfirm}
      />

      {/* Pending Payments Dialog */}
      <PendingPaymentsDialog
        open={showPendingPayments}
        onOpenChange={setShowPendingPayments}
        branchId={selectedBranch || undefined}
      />
    </>
  );
};
