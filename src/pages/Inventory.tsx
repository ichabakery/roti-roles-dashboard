import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/hooks/useInventory';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { EnhancedInventoryTable } from '@/components/inventory/EnhancedInventoryTable';
import { InventoryKPICards } from '@/components/inventory/InventoryKPICards';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { BatchAddStockDialog } from '@/components/inventory/BatchAddStockDialog';
import { StockMonitoring } from '@/components/inventory/StockMonitoring';
import { StockConsistencyChecker } from '@/components/inventory/StockConsistencyChecker';
import { isInventoryV1Enabled, isDemoModeEnabled } from '@/utils/featureFlags';
import { getInventoryKPIs } from '@/services/inventoryV1Service';
import { resetDemoData } from '@/services/demoDataService';
import { InventoryKPI } from '@/types/products';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertTriangle, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [kpis, setKPIs] = useState<InventoryKPI>({
    activeSKUs: 0,
    totalUnits: 0,
    lowStockSKUs: 0,
    expiringItems: 0,
  });
  const [kpisLoading, setKPIsLoading] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  
  const { toast } = useToast();
  
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

  // Load KPIs when inventory V1 is enabled
  useEffect(() => {
    if (isInventoryV1Enabled()) {
      setKPIsLoading(true);
      getInventoryKPIs(selectedBranch === 'all' ? undefined : selectedBranch)
        .then(setKPIs)
        .catch(console.error)
        .finally(() => setKPIsLoading(false));
    }
  }, [selectedBranch]);

  // Demo data reset handler
  const handleResetDemoData = async () => {
    if (!branches?.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada cabang tersedia untuk reset demo data",
      });
      return;
    }

    setResettingDemo(true);
    try {
      // Use first available branch for demo data
      await resetDemoData(branches[0].id);
      
      toast({
        title: "Berhasil",
        description: "Data demo berhasil direset dengan produk contoh bakery",
      });
      
      // Refresh data
      await fetchInventory();
      if (isInventoryV1Enabled()) {
        const newKpis = await getInventoryKPIs(selectedBranch === 'all' ? undefined : selectedBranch);
        setKPIs(newKpis);
      }
    } catch (error) {
      console.error('Error resetting demo data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mereset data demo. Silakan coba lagi.",
      });
    } finally {
      setResettingDemo(false);
    }
  };

  // Show monitoring untuk admin pusat & owner saja
  const showMonitoring = user?.role === 'owner' || user?.role === 'admin_pusat';

  // Tambah stok hanya bisa untuk admin pusat & owner
  const canAddStock = user?.role === 'owner' || user?.role === 'admin_pusat';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Demo Mode Banner */}
        {isDemoModeEnabled() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">DEMO DATA</span>
                <span className="text-yellow-600">- Data contoh untuk testing</span>
              </div>
              {user?.role === 'owner' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetDemoData}
                  disabled={resettingDemo}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${resettingDemo ? 'animate-spin' : ''}`} />
                  {resettingDemo ? 'Mereset...' : 'Reset Data Demo'}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <InventoryHeader
            loading={loading}
            isAddDialogOpen={canAddStock ? isAddDialogOpen : false}
            setIsAddDialogOpen={canAddStock ? setIsAddDialogOpen : () => {}}
            onRefresh={fetchInventory}
          />
          {canAddStock && (
            <Button
              variant="outline"
              onClick={() => setIsBatchDialogOpen(true)}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              Batch Tambah Stok
            </Button>
          )}
        </div>
        
        {showMonitoring && (
          <StockMonitoring />
        )}

        {/* Stock Consistency Checker for Inventory V1 */}
        {isInventoryV1Enabled() && <StockConsistencyChecker />}
        
        {/* Show KPI Cards for Inventory V1 or regular stats */}
        {isInventoryV1Enabled() ? (
          <InventoryKPICards kpis={kpis} loading={kpisLoading} />
        ) : (
          <InventoryStats
            inventory={inventory}
            loading={loading}
          />
        )}
        
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
            
            {/* Use Enhanced Table for Inventory V1 or regular table */}
            {isInventoryV1Enabled() ? (
              <EnhancedInventoryTable 
                inventory={inventory}
                loading={loading}
                searchQuery={searchQuery}
              />
            ) : (
              <InventoryTable
                inventory={inventory}
                loading={loading}
                searchQuery={searchQuery}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialog tambah stok hanya untuk owner & admin pusat */}
        {canAddStock && (
          <>
            <AddStockDialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              products={products}
              branches={branches}
              onAddStock={handleAddStock}
              userRole={user?.role}
              userBranchId={user?.branchId}
            />
            <BatchAddStockDialog
              open={isBatchDialogOpen}
              onOpenChange={setIsBatchDialogOpen}
              branches={branches}
              userId={user?.id || ''}
              onSuccess={fetchInventory}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;