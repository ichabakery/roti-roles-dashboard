
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

export const useCashierPayment = () => {
  const { user } = useAuth();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const validateStock = async (cart: CartItem[], selectedBranch: string) => {
    try {
      console.log('🔍 Validating stock for cart items...');
      
      for (const cartItem of cart) {
        const { data: inventoryData, error } = await supabase
          .from('inventory')
          .select('quantity, product_id, branch_id')
          .eq('product_id', cartItem.product.id)
          .eq('branch_id', selectedBranch)
          .maybeSingle();

        if (error) {
          console.error('❌ Error checking inventory:', error);
          throw new Error(`Gagal memeriksa stok untuk ${cartItem.product.name}: ${error.message}`);
        }

        const availableStock = inventoryData?.quantity || 0;
        console.log(`📦 Stock check - ${cartItem.product.name}: Available=${availableStock}, Required=${cartItem.quantity}`);
        
        if (availableStock < cartItem.quantity) {
          throw new Error(`Stok tidak mencukupi untuk ${cartItem.product.name}. Tersedia: ${availableStock}, Dibutuhkan: ${cartItem.quantity}`);
        }
      }
      
      console.log('✅ Stock validation passed for all items');
      return true;
    } catch (error: any) {
      console.error('❌ Stock validation error:', error);
      toast({
        variant: "destructive",
        title: "Stok Tidak Mencukupi",
        description: error.message,
      });
      return false;
    }
  };

  const processPayment = async (
    cart: CartItem[],
    selectedBranch: string,
    paymentMethod: string,
    calculateTotal: () => number,
    clearCart: () => void,
    verifyBranchAccess: (branchId: string) => Promise<boolean>
  ) => {
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
      console.log('💳 Processing payment...');
      console.log('👤 User ID:', user.id);
      console.log('🏪 Branch ID:', selectedBranch);
      console.log('🛒 Cart items:', cart.length);
      
      const totalAmount = calculateTotal();
      console.log('💰 Total amount:', totalAmount);
      
      // Verify user has access to this branch
      if (user.role === 'kasir_cabang') {
        const accessVerified = await verifyBranchAccess(selectedBranch);
        if (!accessVerified) {
          console.error('🚫 User does not have access to this branch');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Anda tidak memiliki akses ke cabang ini",
          });
          return;
        }
      }

      // Step 1: Validate stock availability
      const stockValid = await validateStock(cart, selectedBranch);
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

      console.log('📝 Creating transaction with data:', transactionData);

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Transaction error:', transactionError);
        throw new Error(`Gagal membuat transaksi: ${transactionError.message}`);
      }

      console.log('✅ Transaction created successfully:', transaction.id);

      // Step 3: Create transaction items (trigger will auto-update inventory with SECURITY DEFINER)
      const transactionItems = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_per_item: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      console.log('📋 Creating transaction items:', transactionItems.length, 'items');

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        console.error('❌ Transaction items error:', itemsError);
        throw new Error(`Gagal menyimpan item transaksi: ${itemsError.message}`);
      }

      console.log('✅ Transaction items created successfully - Database trigger updated inventory automatically');

      // Success - Store complete transaction data
      setLastTransaction(transaction);
      setShowSuccessDialog(true);
      
      // Clear cart
      clearCart();
      
      toast({
        title: "Pembayaran Berhasil",
        description: `Transaksi selesai dengan ID: ${transaction.id.substring(0, 8)}... Stok telah diperbarui otomatis.`,
      });
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      // Enhanced error handling based on common error patterns
      let errorMessage = error.message || "Gagal memproses pembayaran";
      
      if (error.code === '42501') {
        errorMessage = "Akses ditolak. Silakan hubungi administrator.";
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage = "Terjadi masalah keamanan data. Silakan coba lagi atau hubungi administrator.";
      } else if (error.message?.includes('insufficient stock') || error.message?.includes('stok')) {
        errorMessage = error.message; // Keep stock-related messages as is
      }
      
      toast({
        variant: "destructive",
        title: "Error Pembayaran",
        description: errorMessage,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return {
    processingPayment,
    showSuccessDialog,
    lastTransaction,
    setShowSuccessDialog,
    processPayment
  };
};
