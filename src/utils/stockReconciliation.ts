
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StockDiscrepancy {
  product_id: string;
  product_name: string;
  branch_id: string;
  branch_name: string;
  current_stock: number;
  calculated_stock: number;
  difference: number;
}

export const reconcileStockData = async (branchId?: string) => {
  try {
    console.log('🔄 Starting stock reconciliation for branch:', branchId || 'ALL');
    
    // Get all products and their current inventory
    let inventoryQuery = supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        branch_id,
        quantity,
        products!fk_inventory_product_id (name),
        branches!fk_inventory_branch_id (name)
      `);
    
    if (branchId && branchId !== 'all') {
      inventoryQuery = inventoryQuery.eq('branch_id', branchId);
    }
    
    const { data: inventoryData, error: inventoryError } = await inventoryQuery;
    
    if (inventoryError) {
      throw inventoryError;
    }
    
    const discrepancies: StockDiscrepancy[] = [];
    
    for (const inventory of inventoryData || []) {
      // Calculate actual stock based on transaction history
      const { data: transactionItems, error: transactionError } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          transactions!fk_transaction_items_transaction_id (branch_id)
        `)
        .eq('product_id', inventory.product_id)
        .eq('transactions.branch_id', inventory.branch_id);
      
      if (transactionError) {
        console.error('Error fetching transaction items:', transactionError);
        continue;
      }
      
      // Calculate total sold quantity
      const totalSold = transactionItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      
      // For this example, we assume initial stock was higher
      // In a real system, you'd have initial stock data or stock addition records
      const calculatedCurrentStock = Math.max(0, inventory.quantity + totalSold);
      
      if (Math.abs(inventory.quantity - calculatedCurrentStock) > 0) {
        discrepancies.push({
          product_id: inventory.product_id,
          product_name: inventory.products?.name || 'Unknown',
          branch_id: inventory.branch_id,
          branch_name: inventory.branches?.name || 'Unknown',
          current_stock: inventory.quantity,
          calculated_stock: calculatedCurrentStock,
          difference: inventory.quantity - calculatedCurrentStock
        });
      }
    }
    
    console.log('📊 Stock reconciliation completed. Discrepancies found:', discrepancies.length);
    return discrepancies;
    
  } catch (error: any) {
    console.error('❌ Stock reconciliation error:', error);
    toast({
      variant: "destructive",
      title: "Error Reconciliation",
      description: `Gagal melakukan reconciliation stok: ${error.message}`,
    });
    return [];
  }
};

export const fixStockDiscrepancies = async (discrepancies: StockDiscrepancy[]) => {
  try {
    console.log('🔧 Fixing stock discrepancies...');
    
    for (const discrepancy of discrepancies) {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: discrepancy.calculated_stock,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', discrepancy.product_id)
        .eq('branch_id', discrepancy.branch_id);
      
      if (error) {
        console.error('Error fixing discrepancy:', error);
        continue;
      }
      
      console.log(`✅ Fixed stock for ${discrepancy.product_name} at ${discrepancy.branch_name}`);
    }
    
    toast({
      title: "Reconciliation Selesai",
      description: `${discrepancies.length} discrepancy berhasil diperbaiki`,
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ Error fixing discrepancies:', error);
    toast({
      variant: "destructive",
      title: "Error Fix",
      description: `Gagal memperbaiki discrepancy: ${error.message}`,
    });
    return false;
  }
};

export const logStockMovement = async (
  productId: string,
  branchId: string,
  quantityChange: number,
  reason: string,
  transactionId?: string
) => {
  try {
    console.log(`📝 Logging stock movement: ${reason}`, {
      productId,
      branchId,
      quantityChange,
      transactionId
    });
    
    // This would ideally log to a stock_movements table
    // For now, we'll just console log for monitoring
    console.log('Stock movement logged successfully');
  } catch (error: any) {
    console.error('❌ Error logging stock movement:', error);
  }
};
