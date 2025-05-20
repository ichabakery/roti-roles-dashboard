
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BarChart, DownloadIcon, FilterIcon, PrinterIcon, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Branch {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  branch: Branch;
  cashier_name?: string;
}

interface TransactionSummary {
  branch_id: string;
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
}

const Reports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    fetchBranches();
  }, []);
  
  useEffect(() => {
    // For kasir role, auto-select their branch
    if (user?.role === 'kasir_cabang' && user.branchId) {
      setSelectedBranch(user.branchId);
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedBranch || user?.role === 'owner' || user?.role === 'admin_pusat') {
      fetchTransactions();
    }
  }, [selectedBranch, dateRange]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (error) {
        throw error;
      }

      setBranches(data || []);
      
      if (user?.role === 'kasir_cabang' && user.branchId) {
        setSelectedBranch(user.branchId);
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('id, branch_id, cashier_id, transaction_date, total_amount, payment_method, branch:branches(id, name)');
        
      if (selectedBranch && user?.role === 'kasir_cabang') {
        // Kasir can only see their own branch
        query = query.eq('branch_id', selectedBranch);
      } else if (selectedBranch) {
        // Filter by selected branch for other roles
        query = query.eq('branch_id', selectedBranch);
      }
      
      // Add date range filter
      query = query
        .gte('transaction_date', dateRange.start + 'T00:00:00')
        .lte('transaction_date', dateRange.end + 'T23:59:59');
      
      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) {
        throw error;
      }

      // Mock data if no transactions found
      if (!data || data.length === 0) {
        // Create mock transactions for demo purposes
        const mockTransactions = generateMockTransactions(selectedBranch);
        setTransactions(mockTransactions);
        
        // Generate summary from mock data
        const mockSummary = generateMockSummary(mockTransactions);
        setSummary(mockSummary);
      } else {
        setTransactions(data);
        
        // Generate summary from real data
        const summaryData = generateSummary(data);
        setSummary(summaryData);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data transaksi: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock transactions for demo
  const generateMockTransactions = (branchId: string | null): Transaction[] => {
    const paymentMethods = ['cash', 'card', 'transfer'];
    const mockData: Transaction[] = [];
    
    let startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    while (startDate <= endDate) {
      const branchesToUse = branchId ? 
        branches.filter(b => b.id === branchId) : 
        branches;
      
      if (branchesToUse.length === 0) {
        break;
      }
      
      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < transactionsPerDay; i++) {
        const randomBranch = branchesToUse[Math.floor(Math.random() * branchesToUse.length)];
        
        mockData.push({
          id: `mock-${startDate.toISOString()}-${i}`,
          branch_id: randomBranch.id,
          cashier_id: user?.id || 'unknown',
          transaction_date: startDate.toISOString(),
          total_amount: Math.floor(Math.random() * 500000) + 10000,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          branch: randomBranch,
          cashier_name: user?.name || 'Demo User'
        });
      }
      
      // Move to next day
      startDate.setDate(startDate.getDate() + 1);
    }
    
    return mockData;
  };

  // Generate summary from transactions
  const generateSummary = (data: Transaction[]): TransactionSummary[] => {
    const summaryMap = new Map<string, TransactionSummary>();
    
    data.forEach(transaction => {
      const branchId = transaction.branch_id;
      const branchName = transaction.branch?.name || 'Unknown Branch';
      
      if (!summaryMap.has(branchId)) {
        summaryMap.set(branchId, {
          branch_id: branchId,
          branch_name: branchName,
          total_transactions: 0,
          total_revenue: 0
        });
      }
      
      const summary = summaryMap.get(branchId)!;
      summary.total_transactions += 1;
      summary.total_revenue += transaction.total_amount;
    });
    
    return Array.from(summaryMap.values());
  };

  // Generate mock summary
  const generateMockSummary = (mockTransactions: Transaction[]): TransactionSummary[] => {
    return generateSummary(mockTransactions);
  };

  const filteredTransactions = transactions.filter(transaction => 
    transaction.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalRevenue = () => {
    return summary.reduce((total, item) => total + item.total_revenue, 0);
  };

  const getTotalTransactions = () => {
    return summary.reduce((total, item) => total + item.total_transactions, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h2>
            <p className="text-muted-foreground">
              {user?.role === 'kasir_cabang' 
                ? 'Lihat laporan keuangan dari cabang Anda' 
                : 'Lihat laporan keuangan dari semua cabang'}
            </p>
          </div>
          
          <Button variant="outline">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>

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
                {getTotalTransactions() > 0 
                  ? `Rp ${Math.round(getTotalRevenue() / getTotalTransactions()).toLocaleString('id-ID')}` 
                  : 'Rp 0'}
              </div>
            </CardContent>
          </Card>
        </div>
        
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
                </TabsList>
              </div>
              
              <div className="p-4 flex flex-wrap gap-4">
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
                
                {(user?.role === 'owner' || user?.role === 'admin_pusat') && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="branch-filter">Cabang:</Label>
                    <Select 
                      value={selectedBranch || ''}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger id="branch-filter" className="w-[180px]">
                        <SelectValue placeholder="Semua Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Semua Cabang</SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button variant="outline" onClick={fetchTransactions}>
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
                
                <Button variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Unduh Excel
                </Button>
              </div>
              
              <TabsContent value="summary" className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cabang</TableHead>
                        <TableHead>Jumlah Transaksi</TableHead>
                        <TableHead className="text-right">Total Pendapatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.map((item) => (
                        <TableRow key={item.branch_id}>
                          <TableCell className="font-medium">{item.branch_name}</TableCell>
                          <TableCell>{item.total_transactions}</TableCell>
                          <TableCell className="text-right">Rp {item.total_revenue.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))}
                      {summary.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Tidak ada data transaksi dalam periode yang dipilih
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="transactions" className="p-0">
                <div className="p-4">
                  <div className="flex items-center">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari transaksi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Transaksi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Cabang</TableHead>
                        <TableHead>Metode Pembayaran</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
                          <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                          <TableCell>{transaction.branch?.name}</TableCell>
                          <TableCell>
                            <span className="capitalize">{transaction.payment_method}</span>
                          </TableCell>
                          <TableCell className="text-right">Rp {transaction.total_amount.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            {searchQuery ? 'Tidak ada transaksi yang sesuai dengan pencarian' : 'Tidak ada data transaksi dalam periode yang dipilih'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
