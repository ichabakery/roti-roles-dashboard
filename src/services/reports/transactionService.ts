
import { supabase } from '@/integrations/supabase/client';
import { buildTransactionQuery, applyRoleBasedFiltering, applyDateRangeFilter, fetchTransactionDetails } from './queryBuilder';
import { handleTransactionQueryError } from './errorHandler';

export const fetchTransactionsFromDB = async (
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  dateRange?: { start: string; end: string }
) => {
  console.log('🔍 ===== REPORTS FETCH START =====');
  console.log('🔍 Input parameters:', {
    userRole,
    userBranchId,
    selectedBranch,
    dateRange,
    timestamp: new Date().toISOString()
  });

  // Enhanced validation - only for roles that actually need branch assignment
  if (userRole === 'kasir_cabang' && !userBranchId) {
    console.error('❌ Kasir cabang missing required branch assignment');
    throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
  }

  // For other roles, log but don't throw error
  if (['owner', 'admin_pusat', 'kepala_produksi'].includes(userRole)) {
    console.log('✅ Role with multi-branch access:', userRole, 'userBranchId:', userBranchId || 'not required');
  }

  try {
    // Build simplified query
    let transactionQuery = buildTransactionQuery();

    // Apply role-based filtering
    transactionQuery = applyRoleBasedFiltering(transactionQuery, userRole, userBranchId, selectedBranch);

    // Apply date range filter
    transactionQuery = applyDateRangeFilter(transactionQuery, dateRange);

    console.log('🚀 Executing simplified transaction query...');
    const { data: transactionData, error } = await transactionQuery;

    if (error) {
      console.error('❌ Query execution error:', error);
      handleTransactionQueryError(error, userRole);
      return []; // This won't be reached due to throw above, but helps TypeScript
    }

    console.log('📊 Basic transactions fetched:', {
      recordCount: transactionData?.length || 0,
      firstRecord: transactionData?.[0] || null
    });

    if (!transactionData || transactionData.length === 0) {
      console.log('📋 No transactions found');
      return [];
    }

    // Fetch related data separately
    const transactionIds = transactionData.map(t => t.id);
    console.log('🔍 Fetching details for transaction IDs:', transactionIds);
    
    const transactionDetails = await fetchTransactionDetails(transactionIds);
    console.log('📋 Transaction details fetched:', {
      items: transactionDetails.items.length,
      profiles: transactionDetails.profiles.length,
      branches: transactionDetails.branches.length
    });

    // Enrich transactions with related data
    const enrichedTransactions = transactionData.map(transaction => {
      const transactionItems = transactionDetails.items.filter(item => item.transaction_id === transaction.id);
      const cashierProfile = transactionDetails.profiles.find(p => p.id === transaction.cashier_id);
      const branch = transactionDetails.branches.find(b => b.id === transaction.branch_id);

      console.log(`🔍 Transaction ${transaction.id} enrichment:`, {
        items: transactionItems.length,
        cashier: cashierProfile?.name,
        branch: branch?.name,
        firstItem: transactionItems[0]
      });

      return {
        ...transaction,
        transaction_items: transactionItems || [],
        cashier_name: cashierProfile?.name || 'Unknown Cashier',
        branches: branch ? { id: branch.id, name: branch.name } : { id: '', name: 'Unknown Branch' }
      };
    });

    console.log('🔍 ===== REPORTS FETCH END =====');
    console.log('✅ Final enriched result:', {
      enrichedTransactions: enrichedTransactions.length,
      sampleTransaction: enrichedTransactions[0] || null,
      sampleItems: enrichedTransactions[0]?.transaction_items || []
    });

    return enrichedTransactions;

  } catch (error: any) {
    console.error('❌ Transaction service error:', error);
    handleTransactionQueryError(error, userRole);
    return []; // This won't be reached due to throw above
  }
};
