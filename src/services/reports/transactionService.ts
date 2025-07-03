
import { supabase } from '@/integrations/supabase/client';

export const fetchTransactionsFromDB = async (
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  dateRange?: { start: string; end: string },
  paymentStatusFilter?: string
) => {
  console.log('🔍 ===== REPORTS FETCH START =====');
  console.log('🔍 Input parameters:', {
    userRole,
    userBranchId,
    selectedBranch,
    dateRange,
    paymentStatusFilter,
    timestamp: new Date().toISOString()
  });

  // Simplified validation for kasir_cabang
  if (userRole === 'kasir_cabang' && !userBranchId) {
    console.error('❌ Kasir cabang missing required branch assignment');
    throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
  }

  // Validate date range
  if (!dateRange?.start || !dateRange?.end) {
    console.error('❌ Invalid date range provided:', dateRange);
    throw new Error('Rentang tanggal tidak valid');
  }

  try {
    // Step 1: Fetch transactions without transaction_items first
    console.log('🚀 Building basic transaction query...');
    let query = supabase
      .from('transactions')
      .select('*');

    // Apply role-based filtering
    if (userRole === 'kasir_cabang' && userBranchId) {
      console.log('🏪 Applying kasir branch filter:', userBranchId);
      query = query.eq('branch_id', userBranchId);
    } else if (selectedBranch && selectedBranch !== 'all') {
      console.log('🏪 Applying selected branch filter:', selectedBranch);
      query = query.eq('branch_id', selectedBranch);
    }

    // Apply payment status filter with proper type checking
    if (paymentStatusFilter && paymentStatusFilter !== 'all') {
      console.log('💳 Applying payment status filter:', paymentStatusFilter);
      const validStatuses = ['paid', 'pending', 'partial', 'cancelled'];
      if (validStatuses.includes(paymentStatusFilter)) {
        query = query.eq('payment_status', paymentStatusFilter as 'paid' | 'pending' | 'partial' | 'cancelled');
      }
    }

    // Apply date range filter with proper timezone handling
    if (dateRange?.start && dateRange?.end) {
      console.log('📅 Applying date range filter:', dateRange);
      const startDateTime = `${dateRange.start}T00:00:00.000+07:00`;
      const endDateTime = `${dateRange.end}T23:59:59.999+07:00`;
      
      query = query
        .gte('transaction_date', startDateTime)
        .lte('transaction_date', endDateTime);
    }

    // Order by date
    query = query.order('transaction_date', { ascending: false });

    console.log('🚀 Executing transaction query...');
    const { data: transactionData, error } = await query;

    if (error) {
      console.error('❌ Transaction query error:', error);
      throw new Error(`Error dalam query database: ${error.message}`);
    }

    if (!transactionData || !Array.isArray(transactionData)) {
      console.log('📋 No transactions found');
      return [];
    }

    console.log('📊 Transactions fetched:', transactionData.length);

    // Step 2: Fetch transaction items separately
    const transactionIds = transactionData.map(t => t.id);
    let transactionItems: any[] = [];
    
    if (transactionIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          *,
          products (
            id,
            name,
            price
          )
        `)
        .in('transaction_id', transactionIds);

      if (itemsError) {
        console.error('❌ Transaction items query error:', itemsError);
        // Don't throw error here - continue without items
      } else {
        transactionItems = itemsData || [];
      }
    }

    // Step 3: Fetch branches and profiles
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name');

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name');

    console.log('📋 Additional data fetched:', {
      branches: branches?.length || 0,
      profiles: profiles?.length || 0,
      items: transactionItems.length
    });

    // Step 4: Combine the data
    const enrichedTransactions = transactionData.map(transaction => {
      const branch = branches?.find(b => b.id === transaction.branch_id);
      const cashierProfile = profiles?.find(p => p.id === transaction.cashier_id);
      const items = transactionItems.filter(item => item.transaction_id === transaction.id);

      return {
        ...transaction,
        cashier_name: cashierProfile?.name || 'Unknown Cashier',
        branches: branch ? { id: branch.id, name: branch.name } : { id: '', name: 'Unknown Branch' },
        transaction_items: items
      };
    });

    console.log('✅ Final enriched result:', {
      enrichedTransactions: enrichedTransactions.length,
      sampleTransaction: enrichedTransactions[0] || null
    });

    console.log('🔍 ===== REPORTS FETCH END =====');
    return enrichedTransactions;

  } catch (error: any) {
    console.error('❌ Transaction service error:', error);
    throw new Error(`Gagal memuat data transaksi: ${error.message}`);
  }
};
