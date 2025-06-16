
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentData } from '@/components/cashier/PaymentOptionsDialog';

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
  payment_status: string;
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
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
    verifyBranchAccess: (branchId: string) => Promise<boolean>,
    paymentData?: PaymentData
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
      console.log('💳 Processing payment with data:', paymentData);
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

      // For deferred payments, we don't need to validate stock immediately
      // For other payment types, validate stock
      if (!paymentData || paymentData.type !== 'deferred') {
        const stockValid = await validateStock(cart, selectedBranch);
        if (!stockValid) {
          return;
        }
      }

      // Determine payment status and amounts based on payment type
      let payment_status = 'paid';
      let amount_paid = totalAmount;
      let amount_remaining = 0;
      let due_date = null;

      if (paymentData) {
        switch (paymentData.type) {
          case 'deferred':
            payment_status = 'pending';
            amount_paid = 0;
            amount_remaining = totalAmount;
            due_date = paymentData.dueDate || null;
            break;
          case 'down_payment':
            payment_status = 'partial';
            amount_paid = paymentData.amountPaid || 0;
            amount_remaining = totalAmount - amount_paid;
            due_date = paymentData.dueDate || null;
            break;
          case 'full':
          default:
            payment_status = 'paid';
            amount_paid = totalAmount;
            amount_remaining = 0;
            break;
        }
      }

      // Create transaction
      const transactionData = {
        branch_id: selectedBranch,
        cashier_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentData?.paymentMethod || paymentMethod,
        payment_status,
        amount_paid: amount_paid > 0 ? amount_paid : null,
        amount_remaining: amount_remaining > 0 ? amount_remaining : null,
        due_date,
        notes: paymentData?.notes || null
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

      // Create transaction items
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

      // For paid and partial payments, record the payment history
      if (amount_paid > 0) {
        const { error: paymentHistoryError } = await supabase
          .from('payment_history')
          .insert({
            transaction_id: transaction.id,
            amount_paid: amount_paid,
            payment_method: paymentData?.paymentMethod || paymentMethod,
            cashier_id: user.id,
            notes: paymentData?.notes || null
          });

        if (paymentHistoryError) {
          console.error('❌ Payment history error:', paymentHistoryError);
          // Don't throw error here, just log it
        }
      }

      console.log('✅ Transaction items created successfully');

      // Success - Store complete transaction data
      setLastTransaction(transaction);
      setShowSuccessDialog(true);
      
      // Clear cart
      clearCart();
      
      const statusText = payment_status === 'paid' ? 'lunas' : 
                        payment_status === 'partial' ? 'sebagian dibayar' : 'pending';
      
      toast({
        title: "Transaksi Berhasil",
        description: `Transaksi ${statusText} dengan ID: ${transaction.id.substring(0, 8)}...`,
      });
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      let errorMessage = error.message || "Gagal memproses pembayaran";
      
      if (error.code === '42501') {
        errorMessage = "Akses ditolak. Silakan hubungi administrator.";
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage = "Terjadi masalah keamanan data. Silakan coba lagi atau hubungi administrator.";
      } else if (error.message?.includes('insufficient stock') || error.message?.includes('stok')) {
        errorMessage = error.message;
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
