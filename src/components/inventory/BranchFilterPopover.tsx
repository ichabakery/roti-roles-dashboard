import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Branch {
  id: string;
  name: string;
}

interface BranchFilterPopoverProps {
  branches: Branch[];
  selectedBranches: string[];
  onSelectionChange: (selected: string[]) => void;
}

export const BranchFilterPopover: React.FC<BranchFilterPopoverProps> = ({
  branches,
  selectedBranches,
  onSelectionChange,
}) => {
  const allSelected = selectedBranches.length === branches.length;
  const noneSelected = selectedBranches.length === 0;

  const handleToggle = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      onSelectionChange(selectedBranches.filter((id) => id !== branchId));
    } else {
      onSelectionChange([...selectedBranches, branchId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(branches.map((b) => b.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[140px]">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Cabang</span>
          <Badge 
            variant={noneSelected ? "destructive" : "secondary"} 
            className="ml-1 h-5 px-1.5 text-xs"
          >
            {selectedBranches.length}/{branches.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {/* Header with quick actions */}
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm font-medium">Filter Cabang</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
                disabled={allSelected}
                className="h-7 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Semua
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                disabled={noneSelected}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Hapus
              </Button>
            </div>
          </div>

          {/* Branch list */}
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`branch-${branch.id}`}
                    checked={selectedBranches.includes(branch.id)}
                    onCheckedChange={() => handleToggle(branch.id)}
                  />
                  <Label
                    htmlFor={`branch-${branch.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {branch.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Warning if none selected */}
          {noneSelected && (
            <p className="text-xs text-destructive">
              Pilih minimal satu cabang untuk menampilkan tabel
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
