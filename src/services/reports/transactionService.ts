
import { supabase } from '@/integrations/supabase/client';
import { buildTransactionQuery, applyRoleBasedFiltering, applyDateRangeFilter, fetchTransactionDetails } from './queryBuilder';
import { handleTransactionQueryError } from './errorHandler';

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
    // Build basic query with proper joins
    console.log('🚀 Building transaction query...');
    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (
          id,
          product_id,
          quantity,
          price_per_item,
          subtotal,
          products (
            id,
            name,
            price
          )
        )
      `);

    // Apply role-based filtering
    if (userRole === 'kasir_cabang' && userBranchId) {
      console.log('🏪 Applying kasir branch filter:', userBranchId);
      query = query.eq('branch_id', userBranchId);
    } else if (selectedBranch && selectedBranch !== 'all') {
      console.log('🏪 Applying selected branch filter:', selectedBranch);
      query = query.eq('branch_id', selectedBranch);
    }

    // Apply payment status filter
    if (paymentStatusFilter && paymentStatusFilter !== 'all') {
      console.log('💳 Applying payment status filter:', paymentStatusFilter);
      query = query.eq('payment_status', paymentStatusFilter);
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

    console.log('📊 Transactions fetched:', {
      count: transactionData.length,
      firstTransaction: transactionData[0] || null,
      sampleItems: transactionData[0]?.transaction_items || []
    });

    // Fetch additional details (branches and profiles)
    const transactionIds = transactionData.map(t => t.id);
    
    // Fetch branches
    const { data: branches } = await supabase
      .from('branches')
      .select('id, name');

    // Fetch profiles for cashier names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name');

    console.log('📋 Additional data fetched:', {
      branches: branches?.length || 0,
      profiles: profiles?.length || 0
    });

    // Enrich transactions with related data
    const enrichedTransactions = transactionData.map(transaction => {
      const branch = branches?.find(b => b.id === transaction.branch_id);
      const cashierProfile = profiles?.find(p => p.id === transaction.cashier_id);

      return {
        ...transaction,
        cashier_name: cashierProfile?.name || 'Unknown Cashier',
        branches: branch ? { id: branch.id, name: branch.name } : { id: '', name: 'Unknown Branch' }
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
