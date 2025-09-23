
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PackagePlus, RefreshCw } from 'lucide-react';

interface InventoryHeaderProps {
  loading: boolean;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  onRefresh: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  loading,
  isAddDialogOpen,
  setIsAddDialogOpen,
  onRefresh
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Manajemen Stok
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Kelola stok produk di setiap cabang
        </p>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={loading}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm">
              <PackagePlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tambah Stok</span>
              <span className="sm:hidden">Tambah</span>
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};
