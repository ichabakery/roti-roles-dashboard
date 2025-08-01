
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
import { ProductTable } from '@/components/cashier/ProductTable';
import { CartPanel } from '@/components/cashier/CartPanel';
import { PaymentSuccessDialog } from '@/components/cashier/PaymentSuccessDialog';
import { CashierHeader } from '@/components/cashier/CashierHeader';
import { StockValidationAlert } from '@/components/cashier/StockValidationAlert';
import { PaymentData } from '@/components/cashier/PaymentOptionsDialog';

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
  
  const { viewMode, setViewMode, searchQuery, setSearchQuery, paymentMethod, setPaymentMethod } = useCashierState();
  const { products, loading: productsLoading } = useProducts({
    branchId: selectedBranch,
    filterByStock: true,
    withStock: true
  });
  
  const {
    processingPayment,
    showSuccessDialog,
    lastTransaction,
    setShowSuccessDialog,
    processPayment
  } = useCashierPayment();

  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProcessPayment = (paymentData?: PaymentData) => {
    processPayment(
      cart,
      selectedBranch!,
      paymentMethod,
      calculateTotal,
      clearCart,
      verifyBranchAccess,
      paymentData
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
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <StockValidationAlert branchError={branchError} />
          
          {viewMode === 'grid' ? (
            <ProductGrid
              products={filteredProducts}
              loading={productsLoading}
              searchQuery={searchQuery}
              onAddToCart={addToCart}
            />
          ) : (
            <ProductTable
              products={filteredProducts}
              loading={productsLoading}
              searchQuery={searchQuery}
              onAddToCart={addToCart}
            />
          )}
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
