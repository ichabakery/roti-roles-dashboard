
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Branch, DateRange } from '@/types/reports';
import { Calendar, Filter, Search } from 'lucide-react';

interface EnhancedFiltersProps {
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (status: string) => void;
  sourceTypeFilter: string;
  onSourceTypeChange: (sourceType: string) => void;
  onQuickDateRange: (days: number) => void;
  onTodayDateRange: () => void;
  isBranchSelectionDisabled: boolean;
  availableBranches: Branch[];
}

export const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  branches,
  selectedBranch,
  onBranchChange,
  dateRange,
  onDateRangeChange,
  searchQuery,
  onSearchChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  sourceTypeFilter,
  onSourceTypeChange,
  onQuickDateRange,
  onTodayDateRange,
  isBranchSelectionDisabled,
  availableBranches
}) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filter Laporan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Branch Filter */}
          <div className="space-y-2">
            <Label>Cabang</Label>
            <Select 
              value={selectedBranch} 
              onValueChange={onBranchChange}
              disabled={isBranchSelectionDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih cabang" />
              </SelectTrigger>
              <SelectContent>
                {!isBranchSelectionDisabled && (
                  <SelectItem value="all">Semua Cabang</SelectItem>
                )}
                {availableBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-2">
            <Label>Status Pembayaran</Label>
            <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="partial">Sebagian Dibayar</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Type Filter */}
          <div className="space-y-2">
            <Label>Sumber</Label>
            <Select value={sourceTypeFilter} onValueChange={onSourceTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sumber</SelectItem>
                <SelectItem value="cashier">Kasir</SelectItem>
                <SelectItem value="order">Pesanan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal Akhir</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onTodayDateRange}>
            <Calendar className="h-3 w-3 mr-1" />
            Hari Ini
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(7)}>
            <Calendar className="h-3 w-3 mr-1" />
            7 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(30)}>
            <Calendar className="h-3 w-3 mr-1" />
            30 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(90)}>
            <Calendar className="h-3 w-3 mr-1" />
            90 Hari
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label>Pencarian</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari ID transaksi, cabang, atau metode pembayaran..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
