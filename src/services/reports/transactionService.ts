
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

  try {
    // For kasir_cabang, we need to get their actual branch assignment from user_branches table
    let actualUserBranchId = userBranchId;
    
    if (userRole === 'kasir_cabang') {
      console.log('🔍 Fetching actual branch assignment for kasir_cabang...');
      const { data: userBranch, error: branchError } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      if (branchError) {
        console.error('❌ Error fetching user branch:', branchError);
        throw new Error(`Error mengambil data cabang user: ${branchError.message}`);
      }
      
      if (userBranch?.branch_id) {
        actualUserBranchId = userBranch.branch_id;
        console.log('✅ Found actual branch assignment:', actualUserBranchId);
      } else {
        console.error('❌ Kasir cabang tidak memiliki assignment cabang');
        throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
      }
    }

    // Validate date range
    if (!dateRange?.start || !dateRange?.end) {
      console.error('❌ Invalid date range provided:', dateRange);
      throw new Error('Rentang tanggal tidak valid');
    }

    // Step 1: Build and execute transaction query - ONLY COMPLETED TRANSACTIONS
    console.log('🚀 Building transaction query...');
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('payment_status', 'paid') // IMPORTANT: Only show fully paid transactions in reports
      .eq('status', 'completed'); // IMPORTANT: Only show completed transactions

    // Apply role-based filtering with actual branch ID
    if (userRole === 'kasir_cabang' && actualUserBranchId) {
      console.log('🏪 Applying kasir branch filter:', actualUserBranchId);
      query = query.eq('branch_id', actualUserBranchId);
    } else if (selectedBranch && selectedBranch !== 'all') {
      console.log('🏪 Applying selected branch filter:', selectedBranch);
      query = query.eq('branch_id', selectedBranch);
    }

    // Apply date range filter with proper timezone handling for Indonesia (WIB = UTC+7)
    if (dateRange?.start && dateRange?.end) {
      console.log('📅 Applying date range filter with Indonesia timezone:', dateRange);
      
      // Convert local date to UTC range for proper querying
      // Start of day in Indonesia timezone (00:00 WIB = 17:00 UTC previous day)
      const startDate = new Date(dateRange.start + 'T00:00:00+07:00');
      // End of day in Indonesia timezone (23:59 WIB = 16:59 UTC next day)  
      const endDate = new Date(dateRange.end + 'T23:59:59+07:00');
      
      console.log('🕐 Converted datetime range:', {
        originalStart: dateRange.start,
        originalEnd: dateRange.end,
        utcStart: startDate.toISOString(),
        utcEnd: endDate.toISOString()
      });
      
      query = query
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());
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
    console.log('📊 Sample transaction with timezone info:', {
      ...transactionData[0],
      transaction_date_local: transactionData[0] ? new Date(transactionData[0].transaction_date).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : null
    });

    // Step 2: Fetch transaction items with product details
    const transactionIds = transactionData.map(t => t.id);
    let transactionItems: any[] = [];
    
    if (transactionIds.length > 0) {
      console.log('📋 Fetching transaction items with product details for', transactionIds.length, 'transactions');
      const { data: itemsData, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          id,
          transaction_id,
          product_id,
          quantity,
          price_per_item,
          subtotal,
          products (
            id,
            name,
            price
          )
        `)
        .in('transaction_id', transactionIds);

      if (itemsError) {
        console.error('❌ Transaction items query error:', itemsError);
        // Don't throw error here - continue without items data
      } else {
        transactionItems = itemsData || [];
        console.log('📋 Transaction items with product details fetched:', transactionItems.length);
        console.log('📋 Sample item with product:', transactionItems[0]);
      }
    }

    // Step 3: Fetch additional data (branches and profiles)
    const [branchesResult, profilesResult] = await Promise.all([
      supabase.from('branches').select('id, name'),
      supabase.from('profiles').select('id, name')
    ]);

    const branches = branchesResult.data || [];
    const profiles = profilesResult.data || [];

    console.log('📋 Additional data fetched:', {
      branches: branches.length,
      profiles: profiles.length
    });

    // Step 4: Combine the data
    const enrichedTransactions = transactionData.map(transaction => {
      const branch = branches.find(b => b.id === transaction.branch_id);
      const cashierProfile = profiles.find(p => p.id === transaction.cashier_id);
      const items = transactionItems.filter(item => item.transaction_id === transaction.id);

      return {
        ...transaction,
        cashier_name: cashierProfile?.name || 'Unknown Cashier',
        branches: branch ? { id: branch.id, name: branch.name } : { id: '', name: 'Unknown Branch' },
        transaction_items: items,
        // Add local datetime for debugging
        local_datetime: new Date(transaction.transaction_date).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    console.log('✅ Final enriched result:', {
      enrichedTransactions: enrichedTransactions.length,
      sampleTransactionWithLocal: enrichedTransactions[0] ? {
        id: enrichedTransactions[0].id,
        utc_date: enrichedTransactions[0].transaction_date,
        local_date: enrichedTransactions[0].local_datetime,
        branch: enrichedTransactions[0].branches?.name,
        items_count: enrichedTransactions[0].transaction_items?.length || 0
      } : null,
      actualBranchUsed: actualUserBranchId
    });

    console.log('🔍 ===== REPORTS FETCH END =====');
    return enrichedTransactions;

  } catch (error: any) {
    console.error('❌ Transaction service error:', error);
    throw new Error(`Gagal memuat data transaksi: ${error.message}`);
  }
};
