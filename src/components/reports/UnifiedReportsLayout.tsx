
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, FileText } from 'lucide-react';
import { CompactFilterBar } from './CompactFilterBar';
import { CompactAnalyticsPanel } from './CompactAnalyticsPanel';
import { EnhancedTransactionTable } from './EnhancedTransactionTable';
import { useUnifiedReports } from '@/hooks/useUnifiedReports';
import { useExportReports } from '@/hooks/useExportReports';

export const UnifiedReportsLayout: React.FC = () => {
  const {
    transactions,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
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

  const { exportTransactions, exportSummary, printReport } = useExportReports();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-gray-600 mt-1">
              {isKasir 
                ? 'Lihat laporan keuangan dari cabang Anda' 
                : 'Lihat laporan keuangan dari semua cabang'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportSummary(summaries.branchSummary)}>
              <FileText className="mr-2 h-4 w-4" />
              Export Summary
            </Button>
            <Button variant="outline" onClick={() => exportTransactions(transactions)}>
              <Download className="mr-2 h-4 w-4" />
              Export Transaksi
            </Button>
            <Button variant="outline" onClick={printReport}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Cetak Laporan
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <CompactFilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        branches={branches}
        isBranchSelectionDisabled={isBranchSelectionDisabled}
        availableBranches={getAvailableBranches()}
        isKasir={isKasir}
        setQuickDateRange={setQuickDateRange}
      />

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel - Transactions */}
        <div className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detail Transaksi</span>
                <span className="text-sm font-normal text-gray-500">
                  {transactions.length} transaksi ditemukan
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <EnhancedTransactionTable 
                transactions={transactions} 
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Analytics */}
        <CompactAnalyticsPanel
          branchSummary={summaries.branchSummary}
          productSummary={summaries.productSummary}
          paymentSummary={summaries.paymentSummary}
        />
      </div>
    </div>
  );
};
