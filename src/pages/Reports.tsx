
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, DownloadIcon, FilterIcon, PrinterIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/hooks/useReports';
import { useExportReports } from '@/hooks/useExportReports';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { SummaryTab } from '@/components/reports/SummaryTab';
import { TransactionsTab } from '@/components/reports/TransactionsTab';
import { ProductsTab } from '@/components/reports/ProductsTab';

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
    getAverageTransaction
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalTransactions()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {getTotalRevenue().toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rata-Rata per Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {Math.round(getAverageTransaction()).toLocaleString('id-ID')}
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <TabsTrigger value="products">Analisis Produk</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Filters */}
              <div className="p-4 flex flex-wrap gap-4 border-b">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-start">Dari:</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-auto"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-end">Sampai:</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-auto"
                  />
                </div>
                
                {!isKasir && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="branch-filter">Cabang:</Label>
                    <Select 
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger id="branch-filter" className="w-[180px]">
                        <SelectValue placeholder="Pilih Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Cabang</SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button variant="outline" onClick={fetchReportsData}>
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
                
                <Button variant="outline" onClick={() => exportSummary(summary)}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Unduh Ringkasan
                </Button>

                <Button variant="outline" onClick={() => exportTransactions(transactions)}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Unduh Transaksi
                </Button>
              </div>
              
              {/* Tab Contents */}
              <TabsContent value="summary" className="p-0">
                <SummaryTab summary={summary} loading={loading} />
              </TabsContent>
              
              <TabsContent value="transactions" className="p-4">
                <TransactionsTab transactions={transactions} loading={loading} />
              </TabsContent>

              <TabsContent value="products" className="p-0">
                <ProductsTab productSummary={productSummary} loading={loading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
