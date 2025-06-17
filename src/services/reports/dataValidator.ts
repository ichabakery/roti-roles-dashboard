
export const validateTransactionData = (rawData: any[]) => {
  console.log('🔍 Validating transaction data:', rawData.length, 'records');
  
  return rawData.filter(transaction => {
    // Basic validation
    if (!transaction.id || !transaction.branch_id || !transaction.cashier_id) {
      console.warn('⚠️ Invalid transaction - missing required fields:', transaction);
      return false;
    }
    
    return true;
  });
};

export const enrichTransactionData = (validData: any[]) => {
  console.log('🔍 Enriching transaction data:', validData.length, 'valid records');
  
  return validData.map(transaction => ({
    ...transaction,
    // Ensure required fields exist
    transaction_items: transaction.transaction_items || [],
    cashier_name: transaction.cashier_name || 'Unknown Cashier',
    branches: transaction.branches || { id: '', name: 'Unknown Branch' },
    // Convert numeric values
    total_amount: Number(transaction.total_amount) || 0,
    // Ensure dates are properly formatted
    transaction_date: transaction.transaction_date
  }));
};
