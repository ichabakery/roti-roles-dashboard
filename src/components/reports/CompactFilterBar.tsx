
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Calendar } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface CompactFilterBarProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  branches: Branch[];
  isBranchSelectionDisabled?: boolean;
  availableBranches: Branch[];
  isKasir: boolean;
  setQuickDateRange: (days: number) => void;
}

export const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  dateRange,
  setDateRange,
  selectedBranch,
  setSelectedBranch,
  searchQuery,
  setSearchQuery,
  branches,
  isBranchSelectionDisabled = false,
  availableBranches,
  isKasir,
  setQuickDateRange
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Quick Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Periode Cepat:</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange(7)}
              className="text-xs"
            >
              7 Hari
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange(30)}
              className="text-xs"
            >
              30 Hari
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setQuickDateRange(90)}
              className="text-xs"
            >
              90 Hari
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari transaksi, cabang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Detailed Filters Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Dari:</span>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sampai:</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Cabang:</span>
          <Select 
            value={selectedBranch}
            onValueChange={setSelectedBranch}
            disabled={isBranchSelectionDisabled}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Cabang" />
            </SelectTrigger>
            <SelectContent>
              {!isKasir && (
                <SelectItem value="all">Semua Cabang</SelectItem>
              )}
              {availableBranches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isBranchSelectionDisabled && (
            <span className="text-xs text-gray-500">(Cabang Anda)</span>
          )}
        </div>
      </div>
    </div>
  );
};
