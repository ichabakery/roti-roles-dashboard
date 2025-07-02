
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
    // Add proper timezone handling and format dates correctly
    const startDateTime = `${dateRange.start}T00:00:00.000Z`;
    const endDateTime = `${dateRange.end}T23:59:59.999Z`;
    
    query = query
      .gte('transaction_date', startDateTime)
      .lte('transaction_date', endDateTime);
    
    console.log('📅 Date filter applied with timezone:', { startDateTime, endDateTime });
  }
  return query;
};

export const fetchTransactionDetails = async (transactionIds: string[]) => {
  console.log('📋 Fetching transaction details for:', transactionIds.length, 'transactions');
  
  if (transactionIds.length === 0) {
    return {
      items: [],
      profiles: [],
      branches: []
    };
  }
  
  // Fetch transaction items with product details
  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .select(`
      id,
      transaction_id,
      product_id,
      quantity,
      price_per_item,
      subtotal,
      products:product_id (
        id,
        name,
        price
      )
    `)
    .in('transaction_id', transactionIds);

  if (itemsError) {
    console.error('❌ Error fetching transaction items:', itemsError);
  }

  // Fetch cashier profiles - get all profiles first, then filter
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name');

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

  console.log('📋 Transaction details fetched:', {
    items: items?.length || 0,
    profiles: allProfiles?.length || 0,
    branches: branches?.length || 0,
    sampleItem: items?.[0]
  });

  return {
    items: items || [],
    profiles: allProfiles || [],
    branches: branches || []
  };
};
