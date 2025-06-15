
import { supabase } from '@/integrations/supabase/client';
import { buildTransactionQuery, applyRoleBasedFiltering, applyDateRangeFilter } from './queryBuilder';
import { validateTransactionData, enrichTransactionData } from './dataValidator';
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

  // Debug: Check what branches exist in system
  const { data: availableBranches } = await supabase
    .from('branches')
    .select('id, name');
  console.log('🏪 Available branches:', availableBranches);

  // Debug: Check what transactions exist (without filters first)
  const { data: allTransactions, count: totalCount } = await supabase
    .from('transactions')
    .select('id, branch_id, transaction_date, total_amount', { count: 'exact' })
    .limit(10);
  
  console.log('💾 Sample transactions in database:', {
    totalCount,
    sampleTransactions: allTransactions
  });

  // Build optimized query with proper foreign key hints
  let transactionQuery = buildTransactionQuery();

  // Apply role-based filtering
  transactionQuery = applyRoleBasedFiltering(transactionQuery, userRole, userBranchId, selectedBranch);

  // Apply date range filter
  transactionQuery = applyDateRangeFilter(transactionQuery, dateRange);

  console.log('🚀 Executing transaction query with filters applied...');
  const { data: transactionData, error } = await transactionQuery;

  if (error) {
    console.error('❌ Query execution error:', error);
    handleTransactionQueryError(error, userRole);
    return []; // This won't be reached due to throw above, but helps TypeScript
  }

  console.log('📊 Raw query result:', {
    recordCount: transactionData?.length || 0,
    firstRecord: transactionData?.[0] || null
  });

  // If no data found, provide more specific debugging
  if (!transactionData || transactionData.length === 0) {
    console.log('🔍 ===== NO DATA DEBUGGING =====');
    
    // Check if it's a date range issue
    if (dateRange) {
      const { data: transactionsInRange } = await supabase
        .from('transactions')
        .select('id, transaction_date, branch_id')
        .gte('transaction_date', dateRange.start + 'T00:00:00')
        .lte('transaction_date', dateRange.end + 'T23:59:59');
      
      console.log('📅 Transactions in date range (no branch filter):', transactionsInRange?.length || 0);
    }
    
    // Check if it's a branch filter issue
    const targetBranch = userRole === 'kasir_cabang' ? userBranchId : selectedBranch;
    if (targetBranch && targetBranch !== 'all') {
      const { data: branchTransactions } = await supabase
        .from('transactions')
        .select('id, transaction_date, branch_id')
        .eq('branch_id', targetBranch);
      
      console.log(`🏪 Transactions for branch ${targetBranch}:`, branchTransactions?.length || 0);
    }
    
    console.log('🔍 ===== END NO DATA DEBUGGING =====');
  }

  // Validate and enrich the data
  const validTransactions = validateTransactionData(transactionData || []);
  const enrichedTransactions = enrichTransactionData(validTransactions);

  console.log('🔍 ===== REPORTS FETCH END =====');
  console.log('✅ Final result:', {
    validTransactions: validTransactions.length,
    enrichedTransactions: enrichedTransactions.length
  });

  return enrichedTransactions;
};
