
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { RoleType } from '@/contexts/AuthContext';
import { PaymentOptionsDialog, PaymentData } from './PaymentOptionsDialog';
import { PendingPaymentsDialog } from './PendingPaymentsDialog';
import { BranchSelector } from './BranchSelector';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CartItemsList } from './CartItemsList';
import { CartActions } from './CartActions';
import { CartItem } from '@/types/cashier';

interface Branch {
  id: string;
  name: string;
}

interface CartPanelProps {
  cart: CartItem[];
  userRole?: RoleType;
  branches: Branch[];
  selectedBranch: string | null;
  onBranchChange: (branchId: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProcessPayment: (paymentData?: PaymentData) => void;
  calculateTotal: () => number;
  branchError?: string | null;
  processingPayment?: boolean;
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
  processingPayment = false
}) => {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);

  const handlePaymentConfirm = (paymentData: PaymentData) => {
    onProcessPayment(paymentData);
  };

  const canProcessPayment = cart.length > 0 && selectedBranch && !branchError && !processingPayment;

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Keranjang
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full flex flex-col">
          <BranchSelector
            userRole={userRole}
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={onBranchChange}
          />

          <PaymentMethodSelector
            paymentMethod={paymentMethod}
            onPaymentMethodChange={onPaymentMethodChange}
          />
          
          {/* Cart Items */}
          <div className="flex-1 overflow-auto">
            <CartItemsList
              cart={cart}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveFromCart={onRemoveFromCart}
            />
          </div>
          
          {/* Total and Actions */}
          <div className="pt-4 border-t mt-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal</span>
              <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold">Rp {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
            
            <CartActions
              canProcessPayment={canProcessPayment}
              processingPayment={processingPayment}
              selectedBranch={selectedBranch}
              cartLength={cart.length}
              onPaymentClick={() => setShowPaymentOptions(true)}
              onPendingClick={() => setShowPendingPayments(true)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Options Dialog */}
      <PaymentOptionsDialog
        open={showPaymentOptions}
        onOpenChange={setShowPaymentOptions}
        totalAmount={calculateTotal()}
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
