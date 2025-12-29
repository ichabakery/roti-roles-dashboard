
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentData } from '@/components/cashier/PaymentOptionsDialog';
import { CartItem, Transaction } from '@/types/cashier';
import { validateStock } from '@/services/stockValidationService';
import { createTransaction } from '@/services/transactionService';
import { supabase } from '@/integrations/supabase/client';

export const useCashierPayment = () => {
  const { user } = useAuth();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

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
      console.log('💳 Processing payment with data:', {
        cartItems: cart.length,
        paymentData,
        userId: user.id,
        branchId: selectedBranch,
        cartDetails: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      });
      
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

      // Create transaction with all product details
      const transaction = await createTransaction({
        cart,
        selectedBranch,
        userId: user.id,
        totalAmount,
        paymentData,
        paymentMethod
      });

      console.log('🎉 Transaction created successfully:', transaction);

      // Fetch branch name from database
      let branchName = 'Cabang';
      try {
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('name')
          .eq('id', selectedBranch)
          .single();
        
        if (!branchError && branchData) {
          branchName = branchData.name;
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch branch name:', error);
      }

      // Store complete transaction data for receipt with product details
      const transactionWithProducts = {
        ...transaction,
        products: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price * item.quantity // This is the subtotal per product
        })),
        cashier_name: user.name || 'Kasir',
        branch_name: branchName,
        received: paymentData?.received,
        change: paymentData?.change
      };

      setLastTransaction(transactionWithProducts);
      setShowSuccessDialog(true);
      
      // Clear cart after successful transaction
      clearCart();
      
      const statusText = transaction.payment_status === 'paid' ? 'lunas' : 
                        transaction.payment_status === 'partial' ? 'sebagian dibayar' : 'pending';
      
      toast({
        title: "Transaksi Berhasil",
        description: `Transaksi ${statusText} dengan ID: ${transaction.id.substring(0, 8)}... Total: Rp ${totalAmount.toLocaleString('id-ID')}`,
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
      } else if (error.message?.includes('Keranjang belanja kosong')) {
        errorMessage = "Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.";
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
