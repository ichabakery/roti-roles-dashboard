
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Branch {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  branches: Branch[];
  userRole?: string;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedBranch,
  setSelectedBranch,
  branches,
  userRole
}) => {
  const canChangeBranch = userRole === 'owner' || userRole === 'admin_pusat' || userRole === 'kepala_produksi';

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center flex-1">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      {canChangeBranch && branches.length > 1 && (
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
    </div>
  );
};
