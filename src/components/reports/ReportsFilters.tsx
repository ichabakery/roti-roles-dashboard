
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterIcon } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface ReportsFiltersProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  branches: Branch[];
  isKasir: boolean;
  onApplyFilter: () => void;
  isBranchSelectionDisabled?: boolean;
  availableBranches?: Branch[];
}

export const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  dateRange,
  setDateRange,
  selectedBranch,
  setSelectedBranch,
  branches,
  isKasir,
  onApplyFilter,
  isBranchSelectionDisabled = false,
  availableBranches = branches
}) => {
  return (
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
      
      <div className="flex items-center gap-2">
        <Label htmlFor="branch-filter">Cabang:</Label>
        <Select 
          value={selectedBranch}
          onValueChange={setSelectedBranch}
          disabled={isBranchSelectionDisabled}
        >
          <SelectTrigger id="branch-filter" className="w-[180px]">
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
          <span className="text-sm text-muted-foreground">
            (Cabang Anda)
          </span>
        )}
      </div>
      
      <Button variant="outline" onClick={onApplyFilter}>
        <FilterIcon className="mr-2 h-4 w-4" />
        Terapkan Filter
      </Button>
    </div>
  );
};
