
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedReports } from '@/hooks/useUnifiedReports';
import { EnhancedFilters } from './EnhancedFilters';
import { TransactionSummaryStats } from './TransactionSummaryStats';
import { EnhancedTransactionTable } from './EnhancedTransactionTable';
import { ReportsCharts } from './ReportsCharts';
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
          summaries={summaries}
          selectedBranch={selectedBranch}
          dateRange={dateRange}
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
      <TransactionSummaryStats summaries={summaries} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="charts">Grafik</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <EnhancedTransactionTable
            transactions={transactions}
            loading={loading}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ringkasan per Cabang</h3>
              {summaries.branchSummary.map((branch) => (
                <div key={branch.branchId} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{branch.branchName}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Transaksi: {branch.totalTransactions}</div>
                    <div>Pendapatan: Rp {branch.totalRevenue.toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Method Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Metode Pembayaran</h3>
              {summaries.paymentSummary.map((payment) => (
                <div key={payment.method} className="p-4 border rounded-lg">
                  <h4 className="font-medium capitalize">{payment.method}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Transaksi: {payment.count}</div>
                    <div>Total: Rp {payment.total.toLocaleString('id-ID')}</div>
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
              <div key={product.productId} className="p-4 border rounded-lg">
                <h4 className="font-medium">{product.productName}</h4>
                <div className="mt-2 text-sm space-y-1">
                  <div>Terjual: {product.totalQuantity} unit</div>
                  <div>Pendapatan: Rp {product.totalRevenue.toLocaleString('id-ID')}</div>
                  <div>Transaksi: {product.transactionCount}x</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <ReportsCharts 
            summaries={summaries}
            transactions={transactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
