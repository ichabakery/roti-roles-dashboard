
import { supabase } from '@/integrations/supabase/client';

export interface DailySalesReportItem {
  no: number;
  product_id: string;
  product_name: string;
  price: number;
  stok_awal: number;
  stock_masuk: number;
  retur: number;
  penjualan: number;
  stok_akhir: number;
  pendapatan: number;
}

export interface DailySalesReportSummary {
  total_pendapatan: number;
  total_penjualan: number;
  total_retur: number;
  total_stock_masuk: number;
}

export const fetchDailySalesReport = async (
  selectedDate: string,
  branchId: string | null
): Promise<{ items: DailySalesReportItem[]; summary: DailySalesReportSummary }> => {
  try {
    // Fetch all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('active', true)
      .order('name');

    if (productsError) throw productsError;

    // Fetch current inventory for the branch
    let inventoryQuery = supabase
      .from('inventory')
      .select('product_id, quantity, branch_id');
    
    if (branchId) {
      inventoryQuery = inventoryQuery.eq('branch_id', branchId);
    }

    const { data: inventory, error: inventoryError } = await inventoryQuery;
    if (inventoryError) throw inventoryError;

    // Fetch stock movements for the selected date
    const startOfDay = `${selectedDate}T00:00:00`;
    const endOfDay = `${selectedDate}T23:59:59`;

    let stockMovementsQuery = supabase
      .from('stock_movements')
      .select('product_id, quantity_change, movement_type, branch_id')
      .gte('movement_date', startOfDay)
      .lte('movement_date', endOfDay);

    if (branchId) {
      stockMovementsQuery = stockMovementsQuery.eq('branch_id', branchId);
    }

    const { data: stockMovements, error: stockMovementsError } = await stockMovementsQuery;
    if (stockMovementsError) throw stockMovementsError;

    // Fetch transactions for the selected date - ONLY CASHIER transactions (not from orders)
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, branch_id, source_type, notes')
      .gte('transaction_date', startOfDay)
      .lte('transaction_date', endOfDay)
      .eq('status', 'completed');

    if (transactionsError) throw transactionsError;
    
    // Filter to only include cashier transactions (not from orders)
    const cashierTransactions = (transactions || []).filter(t => {
      // Check source_type first (new field)
      if (t.source_type === 'order') return false;
      if (t.source_type === 'cashier') return true;
      // Fallback: check notes for order-related keywords
      const notes = (t.notes || '').toLowerCase();
      if (notes.includes('pesanan') || notes.includes('pickup') || notes.includes('ord-')) {
        return false;
      }
      return true;
    });

    // Filter transactions by branch if specified (using cashierTransactions)
    const filteredTransactions = branchId 
      ? cashierTransactions.filter(t => t.branch_id === branchId)
      : cashierTransactions;

    const transactionIds = filteredTransactions.map(t => t.id);

    // Fetch transaction items for these transactions
    let transactionItems: any[] = [];
    if (transactionIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('product_id, quantity, price_per_item, subtotal')
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;
      transactionItems = items || [];
    }

    // Fetch return items for the selected date
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select('id, branch_id')
      .gte('return_date', startOfDay)
      .lte('return_date', endOfDay);

    if (returnsError) throw returnsError;

    const filteredReturns = branchId 
      ? returns?.filter(r => r.branch_id === branchId)
      : returns;

    const returnIds = filteredReturns?.map(r => r.id) || [];

    let returnItems: any[] = [];
    if (returnIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('return_items')
        .select('product_id, quantity')
        .in('return_id', returnIds);

      if (itemsError) throw itemsError;
      returnItems = items || [];
    }

    // Process data for each product
    const reportItems: DailySalesReportItem[] = (products || []).map((product, index) => {
      // Current stock (stok akhir)
      const productInventory = (inventory || [])
        .filter(i => i.product_id === product.id)
        .reduce((sum, i) => sum + (i.quantity || 0), 0);

      // Stock masuk (incoming stock movements)
      const stockMasuk = (stockMovements || [])
        .filter(sm => sm.product_id === product.id && sm.movement_type === 'in')
        .reduce((sum, sm) => sum + Math.abs(sm.quantity_change || 0), 0);

      // Penjualan (sales) - filter transaction items for this product
      const productTransactionItems = transactionItems
        .filter(ti => ti.product_id === product.id);

      const penjualan = productTransactionItems
        .reduce((sum, ti) => sum + (ti.quantity || 0), 0);

      // Pendapatan - gunakan subtotal aktual dari transaksi, bukan product.price
      const pendapatan = productTransactionItems
        .reduce((sum, ti) => sum + (ti.subtotal || ti.quantity * product.price), 0);

      // Retur
      const retur = returnItems
        .filter(ri => ri.product_id === product.id)
        .reduce((sum, ri) => sum + (ri.quantity || 0), 0);

      // Calculate stok awal: Stok Akhir - Stock Masuk + Penjualan + Retur - Retur yang masuk kembali
      // Simplified: Stok Awal = Stok Akhir - Stock Masuk + Penjualan - Retur
      const stokAwal = productInventory - stockMasuk + penjualan - retur;

      return {
        no: index + 1,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        stok_awal: Math.max(0, stokAwal),
        stock_masuk: stockMasuk,
        retur: retur,
        penjualan: penjualan,
        stok_akhir: productInventory,
        pendapatan: pendapatan
      };
    });

    // Filter out products with no activity and no stock
    const activeItems = reportItems.filter(
      item => item.stok_awal > 0 || item.stock_masuk > 0 || item.penjualan > 0 || item.retur > 0 || item.stok_akhir > 0
    );

    // Renumber items
    activeItems.forEach((item, index) => {
      item.no = index + 1;
    });

    // Calculate summary
    const summary: DailySalesReportSummary = {
      total_pendapatan: activeItems.reduce((sum, item) => sum + item.pendapatan, 0),
      total_penjualan: activeItems.reduce((sum, item) => sum + item.penjualan, 0),
      total_retur: activeItems.reduce((sum, item) => sum + item.retur, 0),
      total_stock_masuk: activeItems.reduce((sum, item) => sum + item.stock_masuk, 0)
    };

    return { items: activeItems, summary };
  } catch (error) {
    console.error('Error fetching daily sales report:', error);
    throw error;
  }
};
