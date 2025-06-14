
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCashierAuth } from '@/hooks/useCashierAuth';
import { useCashierPayment } from '@/hooks/useCashierPayment';
import { useCashierState } from '@/hooks/useCashierState';
import { ProductGrid } from '@/components/cashier/ProductGrid';
import { CartPanel } from '@/components/cashier/CartPanel';
import { PaymentSuccessDialog } from '@/components/cashier/PaymentSuccessDialog';
import { CashierHeader } from '@/components/cashier/CashierHeader';
import { StockValidationAlert } from '@/components/cashier/StockValidationAlert';

const Cashier = () => {
  const { cart, addToCart, removeFromCart, updateQuantity, calculateTotal, clearCart } = useCart();
  const { 
    user, 
    branches, 
    selectedBranch, 
    setSelectedBranch, 
    branchError, 
    hasAccess, 
    isCheckingAccess, 
    verifyBranchAccess 
  } = useCashierAuth();
  
  // Use products hook with branch filtering for cashier
  const { products, loading: productsLoading } = useProducts({
    branchId: selectedBranch,
    filterByStock: true
  });
  
  const {
    processingPayment,
    showSuccessDialog,
    lastTransaction,
    setShowSuccessDialog,
    processPayment
  } = useCashierPayment();

  const {
    searchQuery,
    setSearchQuery,
    paymentMethod,
    setPaymentMethod
  } = useCashierState();
  
  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProcessPayment = () => {
    processPayment(
      cart,
      selectedBranch!,
      paymentMethod,
      calculateTotal,
      clearCart,
      verifyBranchAccess
    );
  };

  // Show loading if user is not ready yet
  if (!user || isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have access
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {branchError || 'Anda tidak memiliki akses ke fitur kasir.'}
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Panel Produk */}
        <div className="md:w-2/3 space-y-6">
          <CashierHeader
            branches={branches}
            selectedBranch={selectedBranch}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <StockValidationAlert branchError={branchError} />
          
          <ProductGrid
            products={filteredProducts}
            loading={productsLoading}
            searchQuery={searchQuery}
            onAddToCart={addToCart}
          />
        </div>
        
        {/* Panel Keranjang */}
        <div className="md:w-1/3">
          <CartPanel
            cart={cart}
            userRole={user?.role}
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onProcessPayment={handleProcessPayment}
            calculateTotal={calculateTotal}
            branchError={branchError}
            processingPayment={processingPayment}
          />
        </div>
      </div>

      {/* Success Dialog */}
      <PaymentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        transaction={lastTransaction}
      />
    </DashboardLayout>
  );
};

export default Cashier;
