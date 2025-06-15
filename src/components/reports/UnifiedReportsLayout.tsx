
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompactFilterBar } from './CompactFilterBar';
import { EnhancedTransactionTable } from './EnhancedTransactionTable';
import { TransactionSummaryStats } from './TransactionSummaryStats';
import { EnhancedFilters } from './EnhancedFilters';
import { ExportButtons } from './ExportButtons';
import { useUnifiedReports } from '@/hooks/useUnifiedReports';

export const UnifiedReportsLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [showProductsOnly, setShowProductsOnly] = useState(false);

  const {
    transactions,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir
  } = useUnifiedReports();

  // Filter transactions based on all criteria
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery === '' || 
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCashier = selectedCashier === 'all' || 
      transaction.cashier_name === selectedCashier;
    
    const matchesPaymentMethod = selectedPaymentMethod === 'all' || 
      transaction.payment_method === selectedPaymentMethod;
    
    const matchesProductsOnly = !showProductsOnly || 
      (transaction.transaction_items && transaction.transaction_items.length > 0);
    
    return matchesSearch && matchesCashier && matchesPaymentMethod && matchesProductsOnly;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Transaksi</h1>
            <p className="text-gray-600 mt-1">
              {isKasir 
                ? 'Lihat laporan transaksi dari cabang Anda' 
                : 'Lihat laporan transaksi dari semua cabang'}
            </p>
          </div>
          
          <ExportButtons transactions={filteredTransactions} />
        </div>
      </div>

      {/* Date and Branch Filters */}
      <CompactFilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        searchQuery=""
        setSearchQuery={() => {}}
        branches={branches}
        isBranchSelectionDisabled={isBranchSelectionDisabled}
        availableBranches={getAvailableBranches()}
        isKasir={isKasir}
        setQuickDateRange={setQuickDateRange}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Summary Statistics */}
        <TransactionSummaryStats transactions={filteredTransactions} />

        {/* Enhanced Filters */}
        <EnhancedFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCashier={selectedCashier}
          setSelectedCashier={setSelectedCashier}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          showProductsOnly={showProductsOnly}
          setShowProductsOnly={setShowProductsOnly}
          transactions={transactions}
        />

        {/* Transaction Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detail Transaksi</span>
              <span className="text-sm font-normal text-gray-500">
                {filteredTransactions.length} dari {transactions.length} transaksi
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <EnhancedTransactionTable 
              transactions={filteredTransactions} 
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
