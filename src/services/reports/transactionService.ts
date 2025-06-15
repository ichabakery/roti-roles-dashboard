
import { buildTransactionQuery, applyRoleBasedFiltering, applyDateRangeFilter } from './queryBuilder';
import { validateTransactionData, enrichTransactionData } from './dataValidator';
import { handleTransactionQueryError } from './errorHandler';

export const fetchTransactionsFromDB = async (
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  dateRange?: { start: string; end: string }
) => {
  console.log('🔍 Fetching reports data for user:', {
    role: userRole,
    userBranchId,
    selectedBranch,
    dateRange
  });

  // Enhanced validation for kasir_cabang
  if (userRole === 'kasir_cabang') {
    if (!userBranchId) {
      console.error('❌ Kasir cabang missing branch assignment');
      throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
    }
    console.log('✅ Kasir cabang has valid branch assignment:', userBranchId);
  }

  // Build optimized query with proper foreign key hints
  let transactionQuery = buildTransactionQuery();

  // Apply role-based filtering
  transactionQuery = applyRoleBasedFiltering(transactionQuery, userRole, userBranchId, selectedBranch);

  // Apply date range filter
  transactionQuery = applyDateRangeFilter(transactionQuery, dateRange);

  console.log('🚀 Executing optimized transaction query...');
  const { data: transactionData, error } = await transactionQuery;

  if (error) {
    handleTransactionQueryError(error, userRole);
    return []; // This won't be reached due to throw above, but helps TypeScript
  }

  // Validate and enrich the data
  const validTransactions = validateTransactionData(transactionData);
  const enrichedTransactions = enrichTransactionData(validTransactions);

  return enrichedTransactions;
};
