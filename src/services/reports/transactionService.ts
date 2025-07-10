
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

    // FIXED: Proper timezone handling for Indonesia (WIB = UTC + 7)
    console.log('📅 Input date range (local):', dateRange);
    
    // Convert local Indonesian dates to proper UTC range
    // Indonesian date 2025-07-04 00:00 WIB = 2025-07-03 17:00 UTC
    // Indonesian date 2025-07-04 23:59 WIB = 2025-07-04 16:59 UTC
    const startDateWIB = new Date(dateRange.start + 'T00:00:00');
    const endDateWIB = new Date(dateRange.end + 'T23:59:59');
    
    // Convert to UTC by subtracting 7 hours
    const startDateUTC = new Date(startDateWIB.getTime() - (7 * 60 * 60 * 1000));
    const endDateUTC = new Date(endDateWIB.getTime() - (7 * 60 * 60 * 1000));

    console.log('🕐 FIXED timezone conversion:', {
      inputStart: dateRange.start,
      inputEnd: dateRange.end,
      startWIB: startDateWIB.toISOString(),
      endWIB: endDateWIB.toISOString(),
      startUTC: startDateUTC.toISOString(),
      endUTC: endDateUTC.toISOString(),
      note: 'WIB = UTC + 7, so to query UTC we subtract 7 hours'
    });

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

    // FIXED: Apply proper date range filter with correct UTC conversion
    console.log('📅 Applying CORRECTED date range filter...');
    query = query
      .gte('transaction_date', startDateUTC.toISOString())
      .lte('transaction_date', endDateUTC.toISOString());

    // Order by date
    query = query.order('transaction_date', { ascending: false });

    console.log('🚀 Executing transaction query with FIXED timezone...');
    const { data: transactionData, error } = await query;

    if (error) {
      console.error('❌ Transaction query error:', error);
      throw new Error(`Error dalam query database: ${error.message}`);
    }

    if (!transactionData || !Array.isArray(transactionData)) {
      console.log('📋 No transactions found');
      return [];
    }

    console.log('📊 Transactions fetched with FIXED timezone:', {
      count: transactionData.length,
      sampleTransaction: transactionData[0] ? {
        id: transactionData[0].id,
        utc_date: transactionData[0].transaction_date,
        wib_date: new Date(new Date(transactionData[0].transaction_date).getTime() + (7 * 60 * 60 * 1000)).toISOString(),
        local_formatted: new Date(new Date(transactionData[0].transaction_date).getTime() + (7 * 60 * 60 * 1000)).toLocaleString('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } : null
    });

    // Step 2: Fetch transaction items with product details - FIXED RLS ISSUE
    const transactionIds = transactionData.map(t => t.id);
    let transactionItems: any[] = [];
    
    if (transactionIds.length > 0) {
      console.log('📋 CRITICAL: Fetching transaction items for', transactionIds.length, 'transactions');
      console.log('📋 Transaction IDs to fetch items for:', transactionIds.slice(0, 3), '...'); // Log first 3 IDs
      
      // FIXED: Use different approach based on user role to bypass RLS issues
      let itemsQuery;
      
      if (userRole === 'owner' || userRole === 'admin_pusat') {
        // For owner/admin, use direct query
        itemsQuery = supabase
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
      } else {
        // For kasir_cabang, join with transactions to satisfy RLS
        itemsQuery = supabase
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
            ),
            transactions!inner (
              id,
              branch_id
            )
          `)
          .in('transaction_id', transactionIds);
          
        // Apply branch filter for kasir_cabang  
        if (actualUserBranchId) {
          itemsQuery = itemsQuery.eq('transactions.branch_id', actualUserBranchId);
        }
      }
      
      const { data: itemsData, error: itemsError } = await itemsQuery;

      if (itemsError) {
        console.error('❌ CRITICAL: Transaction items query error:', itemsError);
        console.error('❌ This is why product details are missing!');
        // Don't throw error here - continue without items data but log the issue
        transactionItems = [];
      } else {
        transactionItems = itemsData || [];
        console.log('✅ CRITICAL: Transaction items with product details fetched:', {
          totalItems: transactionItems.length,
          sampleItem: transactionItems[0] ? {
            id: transactionItems[0].id,
            transaction_id: transactionItems[0].transaction_id,
            product_name: transactionItems[0].products?.name,
            quantity: transactionItems[0].quantity,
            price_per_item: transactionItems[0].price_per_item,
            subtotal: transactionItems[0].subtotal
          } : null,
          itemsPerTransaction: transactionIds.map(tid => ({
            transaction_id: tid,
            items_count: transactionItems.filter(item => item.transaction_id === tid).length
          })).slice(0, 3)
        });
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

    // Step 4: Combine the data with FIXED timezone display
    const enrichedTransactions = transactionData.map(transaction => {
      const branch = branches.find(b => b.id === transaction.branch_id);
      const cashierProfile = profiles.find(p => p.id === transaction.cashier_id);
      const items = transactionItems.filter(item => item.transaction_id === transaction.id);

      // FIXED: Proper WIB conversion for display
      const transactionDateUTC = new Date(transaction.transaction_date);
      const transactionDateWIB = new Date(transactionDateUTC.getTime() + (7 * 60 * 60 * 1000));

      const enriched = {
        ...transaction,
        cashier_name: cashierProfile?.name || 'Unknown Cashier',
        branches: branch ? { id: branch.id, name: branch.name } : { id: '', name: 'Unknown Branch' },
        transaction_items: items,
        // FIXED: Add proper local datetime for display
        local_datetime: transactionDateWIB.toLocaleString('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      console.log(`📊 Transaction ${transaction.id.substring(0, 8)} has ${items.length} items:`, 
        items.map(item => ({
          product_name: item.products?.name,
          qty: item.quantity,
          price: item.price_per_item,
          subtotal: item.subtotal
        }))
      );

      return enriched;
    });

    console.log('✅ FINAL RESULT with FIXED timezone and product details:', {
      totalTransactions: enrichedTransactions.length,
      totalTransactionItems: transactionItems.length,
      sampleTransactionWithItems: enrichedTransactions[0] ? {
        id: enrichedTransactions[0].id,
        utc_date: enrichedTransactions[0].transaction_date,
        local_date: enrichedTransactions[0].local_datetime,
        branch: enrichedTransactions[0].branches?.name,
        items_count: enrichedTransactions[0].transaction_items?.length || 0,
        sample_items: enrichedTransactions[0].transaction_items?.slice(0, 2).map(item => ({
          product_name: item.products?.name,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
          subtotal: item.subtotal
        })) || []
      } : null,
      actualBranchUsed: actualUserBranchId,
      timezoneNote: 'UTC dates converted properly to WIB for display'
    });

    console.log('🔍 ===== REPORTS FETCH END (FIXED) =====');
    return enrichedTransactions;

  } catch (error: any) {
    console.error('❌ Transaction service error:', error);
    throw new Error(`Gagal memuat data transaksi: ${error.message}`);
  }
};
