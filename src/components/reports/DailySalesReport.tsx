
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDailySalesReport } from '@/hooks/useDailySalesReport';
import { DailySalesTable } from './DailySalesTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Branch {
  id: string;
  name: string;
}

export const DailySalesReport: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const { toast } = useToast();
  const [branchLoading, setBranchLoading] = useState(true);

  // Check if user is kasir_cabang
  const isKasir = user?.role === 'kasir_cabang';

  // Kasir cabang hanya bisa melihat cabangnya sendiri
  const branchId = isKasir && userBranchId 
    ? userBranchId 
    : (selectedBranch === 'all' ? null : selectedBranch);

  // Guard: Don't fetch until kasir's branch is loaded to prevent cross-branch visibility
  const isBranchReady = !isKasir || !!userBranchId;
  const dateString = isBranchReady ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  const { items, summary, loading } = useDailySalesReport(dateString, branchId);

  // Fetch user's branch assignment for kasir_cabang
  useEffect(() => {
    const fetchUserBranch = async () => {
      setBranchLoading(true);
      try {
        if (user?.role === 'kasir_cabang' && user.id) {
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user branch:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Gagal memuat data cabang"
            });
            return;
          }

          if (userBranch?.branch_id) {
            setUserBranchId(userBranch.branch_id);
            setSelectedBranch(userBranch.branch_id); // Auto-select their branch
          } else {
            toast({
              variant: "destructive",
              title: "Akses Ditolak",
              description: "Akun kasir Anda belum dikaitkan dengan cabang manapun. Hubungi administrator."
            });
          }
        }
      } finally {
        setBranchLoading(false);
      }
    };
    fetchUserBranch();
  }, [user, toast]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setBranches(data);
      }
    };
    fetchBranches();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setSelectedDate(date);
  };

  const exportToCSV = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada data untuk diekspor"
      });
      return;
    }

    const headers = ['NO', 'NAMA BARANG', 'HARGA', 'STOK AWAL', 'STOCK MASUK', 'RETUR', 'PENJUALAN', 'STOK AKHIR', 'PENDAPATAN'];
    const rows = items.map(item => [
      item.no,
      item.product_name,
      item.price,
      item.stok_awal,
      item.stock_masuk,
      item.retur,
      item.penjualan,
      item.stok_akhir,
      item.pendapatan
    ]);

    // Add total row
    rows.push(['', 'TOTAL', '', '', summary.total_stock_masuk, summary.total_retur, summary.total_penjualan, '', summary.total_pendapatan]);

    const csvContent = [
      `LAPORAN PENJUALAN HARIAN - ${format(selectedDate, 'dd MMMM yyyy', { locale: id })}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_harian_${dateString}.csv`;
    link.click();

    toast({
      title: "Export Berhasil",
      description: "File CSV telah diunduh"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Show loading or error state for kasir
  if (isKasir && branchLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Memuat data cabang...</p>
        </div>
      </div>
    );
  }

  if (isKasir && !branchLoading && !userBranchId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Akses Ditolak</p>
          <p className="text-muted-foreground text-sm">
            Akun kasir Anda belum dikaitkan dengan cabang manapun. Hubungi administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Filter Laporan Harian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Section */}
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleQuickDate(0)}>
                Hari Ini
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => handleQuickDate(-1)}>
                Kemarin
              </Button>
            </div>
          </div>

          {/* Branch and Export Section */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {/* Branch Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cabang</label>
              <Select 
                value={selectedBranch} 
                onValueChange={setSelectedBranch}
                disabled={isKasir}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {!isKasir && <SelectItem value="all">Semua Cabang</SelectItem>}
                  {branches
                    .filter(branch => !isKasir || branch.id === userBranchId)
                    .map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="text-xs sm:text-sm">Export</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                <span className="text-xs sm:text-sm">Print</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              Rp {formatCurrency(summary.total_pendapatan)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Pendapatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {summary.total_penjualan} unit
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Penjualan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              +{summary.total_stock_masuk} unit
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Stock Masuk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {summary.total_retur} unit
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Retur</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Header for Print */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">LAPORAN PENJUALAN HARIAN</h1>
        <p className="text-sm">Tanggal: {format(selectedDate, 'dd MMMM yyyy', { locale: id })}</p>
        {selectedBranch !== 'all' && (
          <p className="text-sm">Cabang: {branches.find(b => b.id === selectedBranch)?.name}</p>
        )}
      </div>

      {/* Table */}
      <DailySalesTable items={items} summary={summary} loading={loading} />
    </div>
  );
};
