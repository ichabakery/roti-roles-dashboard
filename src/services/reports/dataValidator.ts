
export const validateTransactionData = (transactionData: any[]) => {
  console.log('✅ Transaction data received:', transactionData?.length || 0, 'records');

  if (!transactionData || transactionData.length === 0) {
    console.log('📋 No transaction data found');
    return [];
  }

  // Validate and log data quality with proper type checking
  const validTransactions = transactionData.filter(transaction => {
    const hasValidItems = transaction.transaction_items && 
                         Array.isArray(transaction.transaction_items) && 
                         transaction.transaction_items.length > 0;
    
    if (!hasValidItems) {
      console.warn('⚠️ Transaction without valid items:', transaction.id);
      return false;
    }

    // Validate each transaction item with proper type checking
    const validItems = transaction.transaction_items.every((item: any) => {
      // Check if products exists and is not an error object
      const hasValidProduct = item.products && 
                             typeof item.products === 'object' && 
                             !('error' in item.products) &&
                             'name' in item.products;
      
      const hasValidNumbers = typeof item.quantity === 'number' && 
                             typeof item.price_per_item === 'number' && 
                             typeof item.subtotal === 'number';
      
      if (!hasValidProduct || !hasValidNumbers) {
        console.warn('⚠️ Invalid transaction item:', item);
      }
      
      return hasValidProduct && hasValidNumbers;
    });

    return validItems;
  });

  console.log(`✅ ${validTransactions.length} valid transactions out of ${transactionData.length} total`);
  return validTransactions;
};

export const enrichTransactionData = (validTransactions: any[]) => {
  // Transform and enrich the data with proper type safety
  const enrichedTransactions = validTransactions.map(transaction => {
    const cashier_name = (transaction.profiles && typeof transaction.profiles === 'object' && 'name' in transaction.profiles) 
      ? transaction.profiles.name 
      : 'Kasir';
    
    const branch_name = (transaction.branches && typeof transaction.branches === 'object' && 'name' in transaction.branches)
      ? transaction.branches.name
      : 'Unknown Branch';
    
    return {
      ...transaction,
      cashier_name,
      branches: {
        id: transaction.branch_id,
        name: branch_name
      },
      // Ensure transaction_items is always an array with valid data
      transaction_items: transaction.transaction_items.map((item: any) => {
        // Type guard to ensure products is valid with null checks
        const products = (item.products && typeof item.products === 'object' && 'name' in item.products)
          ? item.products as { id: string; name: string; description?: string }
          : { id: '', name: 'Produk Tidak Dikenal', description: '' };

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
          subtotal: item.subtotal,
          products
        };
      })
    };
  });

  console.log('✅ Transaction data enriched successfully:', enrichedTransactions.length, 'records');
  
  // Log sample data for debugging (only first record)
  if (enrichedTransactions.length > 0) {
    const sample = enrichedTransactions[0];
    console.log('📋 Sample transaction data:', {
      id: sample.id,
      branch: sample.branches?.name,
      items: sample.transaction_items?.length || 0,
      firstItem: sample.transaction_items?.[0] ? {
        product: sample.transaction_items[0].products?.name,
        quantity: sample.transaction_items[0].quantity,
        price: sample.transaction_items[0].price_per_item,
        subtotal: sample.transaction_items[0].subtotal
      } : null
    });
  }

  return enrichedTransactions;
};
