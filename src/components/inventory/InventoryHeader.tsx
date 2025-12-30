
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
    <div className="flex flex-col gap-3 w-full">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Manajemen Stok
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Kelola stok produk di setiap cabang
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={loading}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm">
              <PackagePlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Tambah
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};
