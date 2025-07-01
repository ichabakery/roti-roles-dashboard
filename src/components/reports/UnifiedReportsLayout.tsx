
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedReports } from '@/hooks/useUnifiedReports';
import { EnhancedFilters } from './EnhancedFilters';
import { TransactionSummaryStats } from './TransactionSummaryStats';
import { EnhancedTransactionTable } from './EnhancedTransactionTable';
import { ExportButtons } from './ExportButtons';

export const UnifiedReportsLayout = () => {
  const {
    transactions,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    paymentStatusFilter,
    setPaymentStatusFilter,
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    summaries,
    setQuickDateRange,
    getAvailableBranches,
    isBranchSelectionDisabled,
    isKasir
  } = useUnifiedReports();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan Transaksi</h1>
          <p className="text-muted-foreground">
            Monitor dan analisis transaksi penjualan
          </p>
        </div>
        <ExportButtons 
          transactions={transactions}
        />
      </div>

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
        onQuickDateRange={setQuickDateRange}
        isBranchSelectionDisabled={isBranchSelectionDisabled}
        availableBranches={getAvailableBranches()}
      />

      {/* Summary Stats */}
      <TransactionSummaryStats 
        transactions={transactions}
      />

      {/* Main Content Tabs - Grafik dihapus */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
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
    </div>
  );
};
