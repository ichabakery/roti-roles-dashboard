
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useProduction } from '@/hooks/useProduction';
import { useProducts } from '@/hooks/useProducts';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/contexts/AuthContext';
import { ProductionRequest } from '@/types/production';
import ProductionRequestList from '@/components/production/ProductionRequestList';
import NewProductionDialog from '@/components/production/NewProductionDialog';
import ProductionDetailDialog from '@/components/production/ProductionDetailDialog';
import ProductionHistory from '@/components/production/ProductionHistory';

const Production = () => {
  const { user } = useAuth();
  const { 
    productionRequests, 
    loading, 
    createProductionRequest, 
    updateProductionRequestStatus,
    deleteProductionRequest
  } = useProduction();
  const { products, loading: productsLoading } = useProducts();
  const { branches, loading: branchesLoading } = useBranches();
  
  const [selectedRequest, setSelectedRequest] = useState<ProductionRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);

  // Filter requests based on status
  const activeRequests = productionRequests.filter(
    req => req.status === 'pending' || req.status === 'in_progress'
  );
  const completedRequests = productionRequests.filter(req => req.status === 'completed');
  const cancelledRequests = productionRequests.filter(req => req.status === 'cancelled');

  const handleViewDetails = (request: ProductionRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled', quantity?: number) => {
    await updateProductionRequestStatus(id, status, quantity);
    if (selectedRequest?.id === id) {
      const updatedRequest = productionRequests.find(req => req.id === id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Produksi</h2>
            <p className="text-muted-foreground">
              Kelola permintaan dan produksi roti
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHistorySheetOpen(true)}>
              <Clock className="mr-2 h-4 w-4" />
              Riwayat Produksi
            </Button>
            <NewProductionDialog 
              products={products}
              branches={branches}
              productsLoading={productsLoading}
              branchesLoading={branchesLoading}
              onAddRequest={createProductionRequest}
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ProductionRequestList 
              requests={activeRequests}
              loading={loading}
              onStatusChange={handleStatusChange}
              onDelete={deleteProductionRequest}
              onViewDetails={handleViewDetails}
              userRole={user?.role || ''}
            />
          </CardContent>
        </Card>
      </div>

      <ProductionDetailDialog 
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        request={selectedRequest}
        onStartRequest={(id) => handleStatusChange(id, 'in_progress')}
        onCompleteRequest={(id) => handleStatusChange(id, 'completed', selectedRequest?.quantity_requested)}
        onCancelRequest={(id) => handleStatusChange(id, 'cancelled')}
        userRole={user?.role || ''}
      />

      <ProductionHistory 
        open={historySheetOpen}
        onOpenChange={setHistorySheetOpen}
        completedRequests={completedRequests}
        cancelledRequests={cancelledRequests}
        loading={loading}
        onViewDetails={handleViewDetails}
      />
    </DashboardLayout>
  );
};

export default Production;
