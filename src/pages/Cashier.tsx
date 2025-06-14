
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
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Filter produk berdasarkan pencarian
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validasi stok sebelum transaksi
  const validateStock = async () => {
    if (!selectedBranch) return false;

    try {
      console.log('Validating stock for cart items...');
      
      for (const cartItem of cart) {
        const { data: inventoryData, error } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', cartItem.product.id)
          .eq('branch_id', selectedBranch)
          .maybeSingle();

        if (error) {
          console.error('Error checking inventory:', error);
          throw new Error(`Gagal memeriksa stok untuk ${cartItem.product.name}`);
        }

        const availableStock = inventoryData?.quantity || 0;
        
        if (availableStock < cartItem.quantity) {
          throw new Error(`Stok tidak mencukupi untuk ${cartItem.product.name}. Tersedia: ${availableStock}, Dibutuhkan: ${cartItem.quantity}`);
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('Stock validation error:', error);
      toast({
        variant: "destructive",
        title: "Stok Tidak Mencukupi",
        description: error.message,
      });
      return false;
    }
  };

  // Update stok inventory
  const updateInventoryStock = async () => {
    if (!selectedBranch) return false;

    try {
      console.log('Updating inventory stock...');
      
      for (const cartItem of cart) {
        // Ambil stok saat ini
        const { data: currentInventory, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', cartItem.product.id)
          .eq('branch_id', selectedBranch)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching current inventory:', fetchError);
          throw new Error(`Gagal mengambil data stok untuk ${cartItem.product.name}`);
        }

        if (!currentInventory) {
          throw new Error(`Stok untuk ${cartItem.product.name} tidak ditemukan di cabang ini`);
        }

        const newQuantity = currentInventory.quantity - cartItem.quantity;
        
        if (newQuantity < 0) {
          throw new Error(`Stok ${cartItem.product.name} tidak mencukupi`);
        }

        // Update stok
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq('product_id', cartItem.product.id)
          .eq('branch_id', selectedBranch);

        if (updateError) {
          console.error('Error updating inventory:', updateError);
          throw new Error(`Gagal memperbarui stok untuk ${cartItem.product.name}`);
        }

        console.log(`Stock updated for ${cartItem.product.name}: ${currentInventory.quantity} -> ${newQuantity}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Inventory update error:', error);
      throw error;
    }
  };

  const handleProcessPayment = async () => {
    if (cart.length === 0 || !selectedBranch || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Keranjang kosong, cabang belum dipilih, atau user tidak terautentikasi",
      });
      return;
    }

    if (processingPayment) return;

    setProcessingPayment(true);

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

      // Step 1: Validate stock availability
      const stockValid = await validateStock();
      if (!stockValid) {
        return;
      }

      // Step 2: Create transaction
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

      // Step 3: Create transaction items
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

      // Step 4: Update inventory stock
      await updateInventoryStock();

      // Success - Store complete transaction data
      setLastTransaction(transaction);
      setShowSuccessDialog(true);
      
      // Clear cart
      clearCart();
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Transaksi selesai dengan ID: ${transaction.id.substring(0, 8)}... Stok telah diperbarui.`,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Error Pembayaran",
        description: error.message || "Gagal memproses pembayaran",
      });
    } finally {
      setProcessingPayment(false);
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
