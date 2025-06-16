
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/types/cashier';

export const validateStock = async (cart: CartItem[], selectedBranch: string): Promise<boolean> => {
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
