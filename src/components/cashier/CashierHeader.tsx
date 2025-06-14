
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface CashierHeaderProps {
  branches: Branch[];
  selectedBranch: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CashierHeader: React.FC<CashierHeaderProps> = ({
  branches,
  selectedBranch,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
        <p className="text-muted-foreground">
          {branches.find(b => b.id === selectedBranch)?.name || 'Pilih Cabang'}
        </p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
