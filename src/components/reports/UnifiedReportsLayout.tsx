
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedReports } from '@/hooks/useUnifiedReports';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { EnhancedFilters } from './EnhancedFilters';
import { TransactionSummaryStats } from './TransactionSummaryStats';
import { EnhancedTransactionTable } from './EnhancedTransactionTable';
import { ExportButtons } from './ExportButtons';
import { DailySalesReport } from './DailySalesReport';
import { BulkSelectionToolbar, VoidBulkAction } from '@/components/common/BulkSelectionToolbar';
import { BulkVoidTransactionsDialog } from '@/components/transactions/BulkVoidTransactionsDialog';
import { useAuth } from '@/contexts/AuthContext';

export const UnifiedReportsLayout = () => {
  const { user } = useAuth();
  const [bulkVoidDialogOpen, setBulkVoidDialogOpen] = useState(false);
  
  const {
    transactions,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    sourceTypeFilter,
    setSourceTypeFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    summaries,
    setQuickDateRange,
    setTodayDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir
  } = useUnifiedReports();

  // Bulk selection for transactions (only for owner)
  const canVoidTransactions = user?.role === 'owner';
  const {
    isSelected,
    toggleSelection,
    toggleSelectAll,
    deselectAll,
    isAllSelected,
    selectedCount,
    hasSelection
  } = useBulkSelection({
    items: transactions,
    getItemId: (tx) => tx.id
  });

  const selectedTransactionIds = transactions
    .filter(tx => isSelected(tx.id))
    .map(tx => tx.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Laporan Transaksi</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor dan analisis transaksi penjualan
          </p>
        </div>
        <ExportButtons 
          transactions={transactions}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="daily" className="text-xs sm:text-sm py-2">Laporan Harian</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm py-2">Transaksi</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">Ringkasan</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm py-2">Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <DailySalesReport />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Enhanced Filters */}
          <EnhancedFilters
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
            sourceTypeFilter={sourceTypeFilter}
            onSourceTypeChange={setSourceTypeFilter}
            onQuickDateRange={setQuickDateRange}
            onTodayDateRange={setTodayDateRange}
            isBranchSelectionDisabled={isBranchSelectionDisabled}
            availableBranches={getAvailableBranches()}
          />

          {/* Summary Stats */}
          <TransactionSummaryStats 
            transactions={transactions}
          />

          <EnhancedTransactionTable
            transactions={transactions}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ringkasan per Cabang</h3>
              {summaries.branchSummary.map((branch) => (
                <div key={branch.branch_id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{branch.branch_name}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Transaksi: {branch.total_transactions}</div>
                    <div>Pendapatan: Rp {branch.total_revenue.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Metode Pembayaran</h3>
              {summaries.paymentSummary.map((payment) => (
                <div key={payment.payment_method} className="p-4 border rounded-lg">
                  <h4 className="font-medium capitalize">{payment.payment_method}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Transaksi: {payment.count}</div>
                    <div>Total: Rp {payment.total_amount.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <h3 className="text-lg font-semibold">Produk Terlaris</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.productSummary.slice(0, 10).map((product) => (
              <div key={product.product_id} className="p-4 border rounded-lg">
                <h4 className="font-medium">{product.product_name}</h4>
                <div className="mt-2 text-sm space-y-1">
                  <div>Terjual: {product.total_quantity} unit</div>
                  <div>Pendapatan: Rp {product.total_revenue.toLocaleString('id-ID')}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Void Dialog */}
      <BulkVoidTransactionsDialog
        open={bulkVoidDialogOpen}
        onOpenChange={setBulkVoidDialogOpen}
        transactionIds={selectedTransactionIds}
        userId={user?.id || ''}
        onSuccess={() => {
          deselectAll();
          window.location.reload();
        }}
      />

      {/* Bulk Selection Toolbar */}
      {hasSelection && canVoidTransactions && (
        <BulkSelectionToolbar
          selectedCount={selectedCount}
          totalCount={transactions.length}
          onDeselectAll={deselectAll}
          itemLabel="transaksi"
          actions={[
            VoidBulkAction(() => setBulkVoidDialogOpen(true))
          ]}
        />
      )}
    </div>
  );
};
