
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
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Stok</h2>
        <p className="text-muted-foreground">
          Kelola stok produk di setiap cabang
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PackagePlus className="mr-2 h-4 w-4" />
              Tambah Stok
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
};
