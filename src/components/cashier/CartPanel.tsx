
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Delete, Printer, ShoppingCart, Clock, Wallet } from 'lucide-react';
import { RoleType } from '@/contexts/AuthContext';
import { PaymentOptionsDialog, PaymentData } from './PaymentOptionsDialog';
import { PendingPaymentsDialog } from './PendingPaymentsDialog';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

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
          {/* Select branch for owner and admin_pusat */}
          {(userRole === 'owner' || userRole === 'admin_pusat') && (
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Cabang</label>
              <Select
                value={selectedBranch || ''}
                onValueChange={onBranchChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Metode Pembayaran */}
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
          
          {/* Daftar item di keranjang */}
          <div className="flex-1 overflow-auto">
            {cart.length > 0 ? (
              <ul className="space-y-2">
                {cart.map(item => (
                  <li key={item.product.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm">Rp {item.product.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.product.id, item.quantity - 1);
                        }}
                      >
                        -
                      </Button>
                      <span>{item.quantity}</span>
                      <Button 
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(item.product.id, item.quantity + 1);
                        }}
                      >
                        +
                      </Button>
                      <Button 
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromCart(item.product.id);
                        }}
                      >
                        <Delete className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p>Keranjang kosong</p>
                <p className="text-sm">Klik produk untuk menambahkan</p>
              </div>
            )}
          </div>
          
          {/* Total dan tombol pembayaran */}
          <div className="pt-4 border-t mt-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Subtotal</span>
              <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold">Rp {calculateTotal().toLocaleString('id-ID')}</span>
            </div>
            
            <div className="space-y-2">
              <Button 
                className="w-full"
                disabled={!canProcessPayment}
                onClick={() => setShowPaymentOptions(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {processingPayment ? 'Memproses...' : 'Pilih Pembayaran'}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={!selectedBranch}
                  onClick={() => setShowPendingPayments(true)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Pending
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={cart.length === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak
                </Button>
              </div>
            </div>
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
