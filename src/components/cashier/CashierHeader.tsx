
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Table, LayoutGrid } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface CashierHeaderProps {
  branches: Branch[];
  selectedBranch: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
}

export const CashierHeader: React.FC<CashierHeaderProps> = ({
  branches,
  selectedBranch,
  searchQuery,
  onSearchChange,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kasir</h2>
        <p className="text-muted-foreground">
          {branches.find(b => b.id === selectedBranch)?.name || 'Pilih Cabang'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            className="pl-8 w-[140px] md:w-[200px]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          <button
            className={`p-2 rounded hover:bg-primary/10 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
            title="Tampilan Grid"
            type="button"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={`p-2 rounded hover:bg-primary/10 ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
            title="Tampilan Tabel"
            type="button"
            onClick={() => setViewMode('table')}
          >
            <Table size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
