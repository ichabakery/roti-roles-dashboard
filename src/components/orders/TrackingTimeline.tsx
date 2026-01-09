import React from 'react';
import { Check, Clock, Factory, Truck, Store, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackingStatus, getTrackingStatusLabel, TRACKING_STATUS_ORDER } from '@/services/orderService';

interface TrackingTimelineProps {
  currentStatus: TrackingStatus | string | null | undefined;
  orderStatus: string;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  currentStatus,
  orderStatus
}) => {
  const getIcon = (status: TrackingStatus) => {
    const icons: Record<TrackingStatus, React.ReactNode> = {
      'in_production': <Factory className="h-4 w-4" />,
      'ready_to_ship': <Package className="h-4 w-4" />,
      'in_transit': <Truck className="h-4 w-4" />,
      'arrived_at_store': <Store className="h-4 w-4" />,
      'delivered': <Check className="h-4 w-4" />
    };
    return icons[status];
  };

  const currentIndex = currentStatus ? TRACKING_STATUS_ORDER.indexOf(currentStatus as TrackingStatus) : -1;
  const isCancelled = orderStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
        <p className="text-destructive font-medium">Pesanan Dibatalkan</p>
        <p className="text-sm text-muted-foreground mt-1">Tracking tidak berlaku untuk pesanan yang dibatalkan</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Timeline */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 z-0" />
        
        {/* Progress Line Active */}
        <div 
          className="absolute left-0 top-1/2 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ 
            width: currentIndex >= 0 ? `${(currentIndex / (TRACKING_STATUS_ORDER.length - 1)) * 100}%` : '0%' 
          }}
        />

        {TRACKING_STATUS_ORDER.map((status, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <div key={status} className="flex flex-col items-center z-10 relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-background border-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : getIcon(status)}
              </div>
              <span className={cn(
                "text-xs mt-2 text-center max-w-[80px]",
                isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {getTrackingStatusLabel(status)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-3">
        {TRACKING_STATUS_ORDER.map((status, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <div key={status} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                  isCompleted 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-background border-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/20"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : getIcon(status)}
              </div>
              <span className={cn(
                "text-sm",
                isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {getTrackingStatusLabel(status)}
              </span>
              {isCurrent && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Saat ini
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
