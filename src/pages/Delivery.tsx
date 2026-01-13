
import React, { useState } from 'react';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeliveryHeader } from '@/components/delivery/DeliveryHeader';
import { DeliveryTabs } from '@/components/delivery/DeliveryTabs';
import { DeliveryOrderCard } from '@/components/delivery/DeliveryOrderCard';
import { DeliveryEmptyState } from '@/components/delivery/DeliveryEmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const Delivery: React.FC = () => {
  const {
    orders,
    loading,
    activeTab,
    setActiveTab,
    updateTrackingStatus,
    assignToSelf,
    refreshOrders,
    orderCounts,
    isKurir
  } = useDeliveryOrders();

  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshOrders();
    setIsRefreshing(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    await updateTrackingStatus(orderId, newStatus);
    setIsUpdating(null);
  };

  const handleAssignToSelf = async (orderId: string) => {
    setIsUpdating(orderId);
    await assignToSelf(orderId);
    setIsUpdating(null);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 flex flex-col -m-3 sm:-m-6">
        <DeliveryHeader 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing} 
        />
        
        <DeliveryTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          counts={orderCounts}
        />

        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <DeliveryEmptyState tab={activeTab} />
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <DeliveryOrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onAssignToSelf={handleAssignToSelf}
                    isUpdating={isUpdating === order.id}
                    isKurir={isKurir}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20" />
      </div>
    </DashboardLayout>
  );
};

export default Delivery;
