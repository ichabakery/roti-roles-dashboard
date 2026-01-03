
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
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium text-sm sm:text-base">Filter Laporan</h3>
        </div>

        {/* Mobile: 3 columns for filters, Desktop: 4+ columns */}
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {/* Branch Filter */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="hidden sm:block text-xs sm:text-sm">Cabang</Label>
            <Select 
              value={selectedBranch} 
              onValueChange={onBranchChange}
              disabled={isBranchSelectionDisabled}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Cabang" />
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
          <div className="space-y-1 sm:space-y-2">
            <Label className="hidden sm:block text-xs sm:text-sm">Status</Label>
            <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="partial">Sebagian</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Type Filter */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="hidden sm:block text-xs sm:text-sm">Sumber</Label>
            <Select value={sourceTypeFilter} onValueChange={onSourceTypeChange}>
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="cashier">Kasir</SelectItem>
                <SelectItem value="order">Pesanan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range - 2 columns on mobile */}
          <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-2">
            <div className="space-y-1 sm:space-y-2">
              <Label className="hidden sm:block text-xs sm:text-sm">Mulai</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label className="hidden sm:block text-xs sm:text-sm">Akhir</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Filters - 2x2 grid on mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onTodayDateRange} className="h-8 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            Hari Ini
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(7)} className="h-8 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            7 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(30)} className="h-8 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            30 Hari
          </Button>
          <Button variant="outline" size="sm" onClick={() => onQuickDateRange(90)} className="h-8 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            90 Hari
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 text-xs sm:text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};
