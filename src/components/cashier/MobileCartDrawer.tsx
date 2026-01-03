import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { CartItemsList } from './CartItemsList';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentOptionsDialog, PaymentData } from './PaymentOptionsDialog';
import { PendingPaymentsDialog } from './PendingPaymentsDialog';
import { CashReceivedInput } from './CashReceivedInput';
import { DiscountInput } from './DiscountInput';
import { CartItem } from '@/types/cashier';
import { ShoppingCart, MoreHorizontal, Clock, Loader2 } from 'lucide-react';

interface MobileCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  userRole?: string;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProcessPayment: (paymentData?: PaymentData) => void;
  calculateTotal: () => number;
  branchError: string | null;
  processingPayment: boolean;
  selectedBranch: string | null;
}

export const MobileCartDrawer: React.FC<MobileCartDrawerProps> = ({
  open,
  onOpenChange,
  cart,
  paymentMethod,
  onPaymentMethodChange,
  onUpdateQuantity,
  onRemoveFromCart,
  onProcessPayment,
  calculateTotal,
  branchError,
  processingPayment,
  selectedBranch
}) => {
  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);
  const [showPendingPayments, setShowPendingPayments] = React.useState(false);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [cashReceived, setCashReceived] = React.useState(0);
  const [changeAmount, setChangeAmount] = React.useState(0);

  const subtotal = calculateTotal();
  const total = Math.max(0, subtotal - discountAmount);
  const canProcessPayment = cart.length > 0 && selectedBranch && !branchError;

  const handleCashChange = (received: number, change: number) => {
    setCashReceived(received);
    setChangeAmount(change);
  };

  const handleQuickPayment = () => {
    const paymentData: PaymentData = {
      type: 'full',
      paymentMethod: paymentMethod,
      received: paymentMethod === 'tunai' ? cashReceived : total,
      change: paymentMethod === 'tunai' ? changeAmount : 0,
      discountAmount: discountAmount,
    };
    onProcessPayment(paymentData);
    onOpenChange(false);
    // Reset states
    setDiscountAmount(0);
    setCashReceived(0);
    setChangeAmount(0);
  };

  const handleAdvancedPayment = (paymentData: PaymentData) => {
    onProcessPayment(paymentData);
    setShowPaymentOptions(false);
    onOpenChange(false);
    // Reset states
    setDiscountAmount(0);
    setCashReceived(0);
    setChangeAmount(0);
  };

  const isPaymentValid = paymentMethod !== 'tunai' || cashReceived >= total;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang ({cart.length} item)
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keranjang kosong</p>
                <p className="text-sm">Pilih produk untuk memulai</p>
              </div>
            ) : (
              <>
                <CartItemsList
                  cart={cart}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveFromCart={onRemoveFromCart}
                />

                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={onPaymentMethodChange}
                />

                {/* Discount Input */}
                <DiscountInput
                  subtotal={subtotal}
                  onDiscountChange={setDiscountAmount}
                  disabled={processingPayment}
                />

                {/* Subtotal & Total */}
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon:</span>
                        <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Cash Input - Show only for tunai */}
                {paymentMethod === 'tunai' && (
                  <CashReceivedInput
                    totalAmount={total}
                    onCashReceivedChange={handleCashChange}
                    disabled={processingPayment}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleQuickPayment}
                    disabled={!canProcessPayment || processingPayment || !isPaymentValid}
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowPaymentOptions(true)}
                    disabled={!canProcessPayment || processingPayment}
                    title="Opsi Pembayaran Lanjutan"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowPendingPayments(true)}
                    title="Pembayaran Tertunda"
                  >
                    <Clock className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <PaymentOptionsDialog
        open={showPaymentOptions}
        onOpenChange={setShowPaymentOptions}
        totalAmount={total}
        onConfirmPayment={handleAdvancedPayment}
      />

      <PendingPaymentsDialog
        open={showPendingPayments}
        onOpenChange={setShowPendingPayments}
        branchId={selectedBranch || ''}
      />
    </>
  );
};
