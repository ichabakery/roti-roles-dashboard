import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { StockMonitoring } from '@/components/inventory/StockMonitoring';

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

  // Show monitoring untuk admin pusat & owner saja
  const showMonitoring = user?.role === 'owner' || user?.role === 'admin_pusat';

  // Tambah stok hanya bisa untuk admin pusat & owner
  const canAddStock = user?.role === 'owner' || user?.role === 'admin_pusat';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <InventoryHeader
          loading={loading}
          isAddDialogOpen={canAddStock ? isAddDialogOpen : false}
          setIsAddDialogOpen={canAddStock ? setIsAddDialogOpen : () => {}}
          onRefresh={fetchInventory}
        />
        
        {showMonitoring && (
          <StockMonitoring />
        )}
        
        <InventoryStats
          inventory={inventory}
          loading={loading}
        />
        
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

        {/* Dialog tambah stok hanya untuk owner & admin pusat */}
        {canAddStock && (
          <AddStockDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            products={products}
            branches={branches}
            onAddStock={handleAddStock}
            userRole={user?.role}
            userBranchId={user?.branchId}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
