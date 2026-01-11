
import React, { useState } from 'react';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
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
    refreshOrders,
    orderCounts
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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
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
                  isUpdating={isUpdating === order.id}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom padding for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default Delivery;
