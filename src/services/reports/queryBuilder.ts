
import { supabase } from '@/integrations/supabase/client';

export const buildTransactionQuery = () => {
  console.log('🔧 Building enhanced transaction query...');
  
  return supabase
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
};

export const applyRoleBasedFiltering = (
  query: any,
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  paymentStatusFilter?: string
) => {
  console.log('🎯 Applying role-based filtering:', {
    userRole,
    userBranchId,
    selectedBranch,
    paymentStatusFilter
  });

  // Apply branch filtering based on role
  if (userRole === 'kasir_cabang') {
    if (!userBranchId) {
      console.error('❌ Kasir cabang missing required branch assignment');
      throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun');
    }
    query = query.eq('branch_id', userBranchId);
    console.log('🏪 Kasir cabang filter applied:', userBranchId);
  } else if (selectedBranch && selectedBranch !== 'all') {
    query = query.eq('branch_id', selectedBranch);
    console.log('🏪 Selected branch filter applied:', selectedBranch);
  }

  // Apply payment status filtering
  if (paymentStatusFilter && paymentStatusFilter !== 'all') {
    query = query.eq('payment_status', paymentStatusFilter);
    console.log('💳 Payment status filter applied:', paymentStatusFilter);
  }

  return query;
};

export const applyDateRangeFilter = (query: any, dateRange?: { start: string; end: string }) => {
  if (dateRange?.start && dateRange?.end) {
    console.log('📅 Applying date range filter:', dateRange);
    query = query
      .gte('transaction_date', dateRange.start)
      .lte('transaction_date', dateRange.end);
  }
  return query;
};

export const fetchTransactionDetails = async (transactionIds: string[]) => {
  console.log('📋 Fetching transaction details for:', transactionIds.length, 'transactions');
  
  // Fetch cashier profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', transactionIds.map(() => '').filter(Boolean)); // This will get all profiles, we'll filter in memory

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
  }

  // Fetch branches
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('id, name');

  if (branchesError) {
    console.error('❌ Error fetching branches:', branchesError);
  }

  return {
    items: [], // Items are already included in the main query
    profiles: profiles || [],
    branches: branches || []
  };
};
