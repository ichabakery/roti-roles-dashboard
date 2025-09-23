
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
  has_initial_data: boolean;
  confidence_level: 'high' | 'medium' | 'low';
}

interface StockCalculationData {
  initialStock: number;
  totalSold: number;
  totalAdjustments: number;
  totalProduced: number;
}

const calculateStockFromHistory = async (productId: string, branchId: string): Promise<StockCalculationData> => {
  // Get initial stock from stock adjustments
  const { data: initialAdjustments } = await supabase
    .from('stock_adjustments')
    .select('quantity_change')
    .eq('product_id', productId)
    .eq('branch_id', branchId)
    .eq('adjustment_type', 'init')
    .order('created_at', { ascending: true });

  // Get all stock adjustments (additions/corrections)
  const { data: allAdjustments } = await supabase
    .from('stock_adjustments')
    .select('quantity_change')
    .eq('product_id', productId)
    .eq('branch_id', branchId)
    .in('adjustment_type', ['adjust_in', 'adjust_out']);

  // Get sales from transaction items
  const { data: transactionItems } = await supabase
    .from('transaction_items')
    .select(`
      quantity,
      transactions!fk_transaction_items_transaction_id (branch_id)
    `)
    .eq('product_id', productId)
    .eq('transactions.branch_id', branchId);

  // Get production additions
  const { data: productions } = await supabase
    .from('production_requests')
    .select('quantity_produced')
    .eq('product_id', productId)
    .eq('branch_id', branchId)
    .eq('status', 'completed');

  const initialStock = initialAdjustments?.reduce((sum, adj) => sum + adj.quantity_change, 0) || 0;
  const totalAdjustments = allAdjustments?.reduce((sum, adj) => sum + adj.quantity_change, 0) || 0;
  const totalSold = transactionItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalProduced = productions?.reduce((sum, prod) => sum + (prod.quantity_produced || 0), 0) || 0;

  return { initialStock, totalSold, totalAdjustments, totalProduced };
};

export const reconcileStockData = async (branchId?: string) => {
  try {
    console.log('🔄 Starting enhanced stock reconciliation for branch:', branchId || 'ALL');
    
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
      console.log(`🔍 Checking ${inventory.products?.name} at ${inventory.branches?.name}`);
      
      const stockData = await calculateStockFromHistory(inventory.product_id, inventory.branch_id);
      
      // Calculate expected current stock: Initial + Adjustments + Production - Sales
      const calculatedCurrentStock = Math.max(0, 
        stockData.initialStock + 
        stockData.totalAdjustments + 
        stockData.totalProduced - 
        stockData.totalSold
      );
      
      // Determine confidence level based on available data
      let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
      let hasInitialData = stockData.initialStock > 0;
      
      if (stockData.initialStock > 0) {
        confidenceLevel = 'high';
      } else if (stockData.totalAdjustments > 0 || stockData.totalProduced > 0) {
        confidenceLevel = 'medium';
      }
      
      console.log(`📊 ${inventory.products?.name}: Current=${inventory.quantity}, Expected=${calculatedCurrentStock}`, {
        initial: stockData.initialStock,
        adjustments: stockData.totalAdjustments,
        produced: stockData.totalProduced,
        sold: stockData.totalSold,
        confidence: confidenceLevel
      });
      
      // Only flag as discrepancy if we have reasonable confidence in the calculation
      if (Math.abs(inventory.quantity - calculatedCurrentStock) > 0 && confidenceLevel !== 'low') {
        discrepancies.push({
          product_id: inventory.product_id,
          product_name: inventory.products?.name || 'Unknown',
          branch_id: inventory.branch_id,
          branch_name: inventory.branches?.name || 'Unknown',
          current_stock: inventory.quantity,
          calculated_stock: calculatedCurrentStock,
          difference: inventory.quantity - calculatedCurrentStock,
          has_initial_data: hasInitialData,
          confidence_level: confidenceLevel
        });
      }
    }
    
    console.log('📊 Enhanced stock reconciliation completed. Discrepancies found:', discrepancies.length);
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
    console.log('🔧 Fixing stock discrepancies with audit trail...');
    
    for (const discrepancy of discrepancies) {
      // Create corrective stock adjustment record
      const adjustmentAmount = discrepancy.calculated_stock - discrepancy.current_stock;
      
      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: discrepancy.product_id,
          branch_id: discrepancy.branch_id,
          adjustment_type: 'adjust_in',
          quantity_change: Math.abs(adjustmentAmount),
          reason: `Auto-correction: Reconciliation fix (${discrepancy.current_stock} → ${discrepancy.calculated_stock})`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (adjustmentError) {
        console.error('Error creating stock adjustment:', adjustmentError);
        continue;
      }

      // Update inventory
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ 
          quantity: discrepancy.calculated_stock,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', discrepancy.product_id)
        .eq('branch_id', discrepancy.branch_id);
      
      if (inventoryError) {
        console.error('Error fixing inventory discrepancy:', inventoryError);
        continue;
      }
      
      console.log(`✅ Fixed stock for ${discrepancy.product_name} at ${discrepancy.branch_name}: ${discrepancy.current_stock} → ${discrepancy.calculated_stock}`);
    }
    
    toast({
      title: "Reconciliation Selesai",
      description: `${discrepancies.length} discrepancy berhasil diperbaiki dengan audit trail`,
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

export const createCorrectiveAdjustment = async (
  productId: string, 
  branchId: string, 
  correctStock: number, 
  reason: string
) => {
  try {
    // Get current inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .single();

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const adjustmentAmount = correctStock - inventory.quantity;

    // Create stock adjustment record
    const { error: adjustmentError } = await supabase
      .from('stock_adjustments')
      .insert({
        product_id: productId,
        branch_id: branchId,
        adjustment_type: adjustmentAmount > 0 ? 'adjust_in' : 'adjust_out',
        quantity_change: Math.abs(adjustmentAmount),
        reason: `Manual correction: ${reason} (${inventory.quantity} → ${correctStock})`,
        performed_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (adjustmentError) throw adjustmentError;

    // Update inventory
    const { error: inventoryError } = await supabase
      .from('inventory')
      .update({ 
        quantity: correctStock,
        last_updated: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('branch_id', branchId);

    if (inventoryError) throw inventoryError;

    console.log(`✅ Created corrective adjustment: ${inventory.quantity} → ${correctStock}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error creating corrective adjustment:', error);
    throw error;
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
