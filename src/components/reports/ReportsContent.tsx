
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart } from 'lucide-react';
import { ReportsCharts } from './ReportsCharts';
import { SummaryTab } from './SummaryTab';
import { TransactionsTab } from './TransactionsTab';
import { TransactionItemsTab } from './TransactionItemsTab';
import { ProductsTab } from './ProductsTab';
import { ReportsFilters } from './ReportsFilters';
import { ReportsExport } from './ReportsExport';
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary, Branch, DateRange } from '@/types/reports';

interface ReportsContentProps {
  transactions: Transaction[];
  summary: TransactionSummary[];
  productSummary: ProductSummary[];
  paymentSummary: PaymentMethodSummary[];
  branches: Branch[];
  loading: boolean;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  fetchReportsData: () => void;
  isKasir: boolean;
  onExportSummary: (summary: TransactionSummary[]) => void;
  onExportTransactions: (transactions: Transaction[]) => void;
  isBranchSelectionDisabled?: boolean;
  availableBranches?: Branch[];
}

export const ReportsContent: React.FC<ReportsContentProps> = ({
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
  isKasir,
  onExportSummary,
  onExportTransactions,
  isBranchSelectionDisabled = false,
  availableBranches = branches
}) => {
  return (
    <div className="space-y-6">
      {/* Charts */}
      {(paymentSummary.length > 0 || productSummary.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Analisis Visual
            </CardTitle>
            <CardDescription>
              Grafik dan diagram untuk analisis data yang lebih mendalam
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsCharts
              paymentSummary={paymentSummary}
              productSummary={productSummary}
              transactions={transactions}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Main Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Transaksi</CardTitle>
          <CardDescription>
            {`Periode: ${new Date(dateRange.start).toLocaleDateString('id-ID')} - ${new Date(dateRange.end).toLocaleDateString('id-ID')}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="summary" className="w-full">
            <div className="px-4 border-b">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="summary">Ringkasan</TabsTrigger>
                <TabsTrigger value="transactions">Detail Transaksi</TabsTrigger>
                <TabsTrigger value="items">Detail Item</TabsTrigger>
                <TabsTrigger value="products">Analisis Produk</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Filters */}
            <ReportsFilters
              dateRange={dateRange}
              setDateRange={setDateRange}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              branches={branches}
              isKasir={isKasir}
              onApplyFilter={fetchReportsData}
              isBranchSelectionDisabled={isBranchSelectionDisabled}
              availableBranches={availableBranches}
            />
            
            {/* Export Buttons */}
            <div className="px-4 py-2 border-b">
              <ReportsExport
                summary={summary}
                transactions={transactions}
                onExportSummary={onExportSummary}
                onExportTransactions={onExportTransactions}
              />
            </div>
            
            {/* Tab Contents */}
            <TabsContent value="summary" className="p-0">
              <SummaryTab summary={summary} loading={loading} />
            </TabsContent>
            
            <TabsContent value="transactions" className="p-4">
              <TransactionsTab transactions={transactions} loading={loading} />
            </TabsContent>

            <TabsContent value="items" className="p-4">
              <TransactionItemsTab transactions={transactions} loading={loading} />
            </TabsContent>

            <TabsContent value="products" className="p-0">
              <ProductsTab 
                productSummary={productSummary} 
                transactions={transactions}
                loading={loading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
