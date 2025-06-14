
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCashierAuth } from '@/hooks/useCashierAuth';
import { ProductGrid } from '@/components/cashier/ProductGrid';
import { CartPanel } from '@/components/cashier/CartPanel';
import { PaymentSuccessDialog } from '@/components/cashier/PaymentSuccessDialog';

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

const Cashier = () => {
  const { products, loading: productsLoading } = useProducts();
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProcessPayment = async () => {
    if (cart.length === 0 || !selectedBranch || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Keranjang kosong, cabang belum dipilih, atau user tidak terautentikasi",
      });
      return;
    }

    try {
      console.log('Processing payment...');
      console.log('User ID:', user.id);
      console.log('Branch ID:', selectedBranch);
      console.log('Cart items:', cart.length);
      
      const totalAmount = calculateTotal();
      console.log('Total amount:', totalAmount);
      
      // Verify user has access to this branch
      if (user.role === 'kasir_cabang') {
        const accessVerified = await verifyBranchAccess(selectedBranch);
        if (!accessVerified) {
          console.error('User does not have access to this branch');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Anda tidak memiliki akses ke cabang ini",
          });
          return;
        }
      }

      // Create transaction
      const transactionData = {
        branch_id: selectedBranch,
        cashier_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod
      };

      console.log('Creating transaction with data:', transactionData);

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error(`Gagal membuat transaksi: ${transactionError.message}`);
      }

      console.log('Transaction created successfully:', transaction);

      // Create transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_per_item: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      console.log('Creating transaction items:', transactionItems);

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        console.error('Transaction items error:', itemsError);
        throw new Error(`Gagal menyimpan item transaksi: ${itemsError.message}`);
      }

      console.log('Transaction items created successfully');

      // Success - Store complete transaction data
      setLastTransaction(transaction);
      setShowSuccessDialog(true);
      
      // Clear cart
      clearCart();
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Transaksi selesai dengan ID: ${transaction.id.substring(0, 8)}...`,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Error Pembayaran",
        description: error.message || "Gagal memproses pembayaran",
      });
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
              <p className="text-muted-foreground">
                {branches.find(b => b.id === selectedBranch)?.name || 'Pilih Cabang'}
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Branch Error Alert */}
          {branchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{branchError}</AlertDescription>
            </Alert>
          )}
          
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
