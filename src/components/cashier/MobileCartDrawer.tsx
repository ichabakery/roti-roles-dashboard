import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { CartItemsList } from './CartItemsList';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CartActions } from './CartActions';
import { PaymentOptionsDialog, PaymentData } from './PaymentOptionsDialog';
import { PendingPaymentsDialog } from './PendingPaymentsDialog';
import { CartItem } from '@/types/cashier';
import { ShoppingCart } from 'lucide-react';

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

  const handleConfirmPayment = (paymentData: PaymentData) => {
    onProcessPayment(paymentData);
    setShowPaymentOptions(false);
    onOpenChange(false);
  };

  const total = calculateTotal();
  const canProcessPayment = cart.length > 0 && selectedBranch && !branchError;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang Belanja ({cart.length} item)
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
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

                {/* Simple Total Display */}
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <CartActions
                  canProcessPayment={!!canProcessPayment}
                  processingPayment={processingPayment}
                  selectedBranch={selectedBranch}
                  cartLength={cart.length}
                  onPaymentClick={() => setShowPaymentOptions(true)}
                  onPendingClick={() => setShowPendingPayments(true)}
                />
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <PaymentOptionsDialog
        open={showPaymentOptions}
        onOpenChange={setShowPaymentOptions}
        totalAmount={total}
        onConfirmPayment={handleConfirmPayment}
      />

      <PendingPaymentsDialog
        open={showPendingPayments}
        onOpenChange={setShowPendingPayments}
        branchId={selectedBranch || ''}
      />
    </>
  );
};
