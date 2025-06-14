
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PrinterIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/hooks/useReports';
import { useExportReports } from '@/hooks/useExportReports';
import { ReportsStats } from '@/components/reports/ReportsStats';
import { ReportsContent } from '@/components/reports/ReportsContent';

const Reports = () => {
  const { user } = useAuth();
  const {
    transactions,
    summary,
    productSummary,
    paymentSummary,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    dateRange,
    setDateRange,
    fetchReportsData,
    getTotalRevenue,
    getTotalTransactions,
    getAverageTransaction,
    isBranchSelectionDisabled,
    availableBranches
  } = useReports();

  const { exportTransactions, exportSummary, printReport } = useExportReports();

  const isKasir = user?.role === 'kasir_cabang';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h2>
            <p className="text-muted-foreground">
              {isKasir 
                ? 'Lihat laporan keuangan dari cabang Anda' 
                : 'Lihat laporan keuangan dari semua cabang'}
            </p>
          </div>
          
          <Button variant="outline" onClick={printReport}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>

        {/* Stats Cards */}
        <ReportsStats
          totalTransactions={getTotalTransactions()}
          totalRevenue={getTotalRevenue()}
          averageTransaction={getAverageTransaction()}
        />

        {/* Main Content */}
        <ReportsContent
          transactions={transactions}
          summary={summary}
          productSummary={productSummary}
          paymentSummary={paymentSummary}
          branches={branches}
          loading={loading}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          dateRange={dateRange}
          setDateRange={setDateRange}
          fetchReportsData={fetchReportsData}
          isKasir={isKasir}
          onExportSummary={exportSummary}
          onExportTransactions={exportTransactions}
          isBranchSelectionDisabled={isBranchSelectionDisabled}
          availableBranches={availableBranches}
        />
      </div>
    </DashboardLayout>
  );
};

export default Reports;
