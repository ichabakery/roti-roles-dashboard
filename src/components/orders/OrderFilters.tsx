import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Branch } from '@/hooks/useBranches';
import { OrderStatus, TrackingStatus, getOrderStatusLabel, getTrackingStatusLabel, TRACKING_STATUS_ORDER } from '@/services/orderService';

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  trackingFilter: string;
  onTrackingFilterChange: (value: string) => void;
  branchFilter: string;
  onBranchFilterChange: (value: string) => void;
  branches: Branch[];
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClearDateFilter: () => void;
  onTodayFilter: () => void;
  showBranchFilter?: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  trackingFilter,
  onTrackingFilterChange,
  branchFilter,
  onBranchFilterChange,
  branches,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearDateFilter,
  onTodayFilter,
  showBranchFilter = true
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari nama pelanggan atau nomor pesanan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Status Filter - Simplified 3 states */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="new">Baru</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        {/* Tracking Filter - 5 stages */}
        <Select value={trackingFilter} onValueChange={onTrackingFilterChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tracking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tracking</SelectItem>
            {TRACKING_STATUS_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {getTrackingStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Branch Filter */}
        {showBranchFilter && (
          <Select value={branchFilter} onValueChange={onBranchFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">Tanggal Pengambilan:</span>
          <div className="flex flex-nowrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[105px] justify-start text-left font-normal text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Dari'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={onDateFromChange}
                  locale={localeId}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-[105px] justify-start text-left font-normal text-xs">
                  <Calendar className="mr-1 h-3 w-3" />
                  {dateTo ? format(dateTo, 'dd/MM/yy') : 'Sampai'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={onDateToChange}
                  locale={localeId}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={onTodayFilter} className="px-2 text-xs">
              Hari Ini
            </Button>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={onClearDateFilter} className="px-2 text-xs">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
