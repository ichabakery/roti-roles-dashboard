
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { PackagePlus, RefreshCw } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const {
    inventory,
    products,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    fetchInventory,
    addStock,
    user
  } = useInventory();

  const handleAddStock = async (productId: string, branchId: string, quantity: number): Promise<boolean> => {
    return await addStock(productId, branchId, quantity);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Stok</h2>
            <p className="text-muted-foreground">
              Kelola stok produk di setiap cabang
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchInventory} disabled={loading}>
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
        
        <Card>
          <CardContent className="pt-6">
            <InventoryFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              branches={branches}
              userRole={user?.role}
            />
            
            <InventoryTable
              inventory={inventory}
              loading={loading}
              searchQuery={searchQuery}
            />
          </CardContent>
        </Card>

        <AddStockDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          products={products}
          branches={branches}
          onAddStock={handleAddStock}
          userRole={user?.role}
          userBranchId={user?.branchId}
        />
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
