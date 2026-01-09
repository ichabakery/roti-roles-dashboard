import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, User, Calendar, CreditCard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Order, TrackingStatus, getTrackingStatusLabel, TRACKING_STATUS_ORDER } from '@/services/orderService';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TrackingKanbanBoardProps {
  orders: Order[];
  onMoveOrder: (orderId: string, newStatus: TrackingStatus) => void;
  onViewDetail: (orderId: string) => void;
  formatCurrency: (amount: number) => string;
  userRole?: string;
}

const getColumnColor = (status: TrackingStatus): string => {
  const colors: Record<TrackingStatus, string> = {
    'in_production': 'border-t-amber-500',
    'ready_to_ship': 'border-t-blue-500',
    'in_transit': 'border-t-purple-500',
    'arrived_at_store': 'border-t-emerald-500',
    'delivered': 'border-t-green-600'
  };
  return colors[status];
};

const getColumnBg = (status: TrackingStatus): string => {
  const colors: Record<TrackingStatus, string> = {
    'in_production': 'bg-amber-50 dark:bg-amber-950/20',
    'ready_to_ship': 'bg-blue-50 dark:bg-blue-950/20',
    'in_transit': 'bg-purple-50 dark:bg-purple-950/20',
    'arrived_at_store': 'bg-emerald-50 dark:bg-emerald-950/20',
    'delivered': 'bg-green-50 dark:bg-green-950/20'
  };
  return colors[status];
};

export const TrackingKanbanBoard: React.FC<TrackingKanbanBoardProps> = ({
  orders,
  onMoveOrder,
  onViewDetail,
  formatCurrency,
  userRole
}) => {
  // Filter out cancelled orders
  const activeOrders = orders.filter(o => o.status !== 'cancelled');

  const getOrdersByTracking = (status: TrackingStatus) => {
    return activeOrders.filter(o => o.tracking_status === status);
  };

  const canMoveToNext = (currentStatus: TrackingStatus): boolean => {
    const currentIndex = TRACKING_STATUS_ORDER.indexOf(currentStatus);
    // Can't move beyond delivered
    if (currentIndex >= TRACKING_STATUS_ORDER.length - 1) return false;
    
    // Kasir can only move to 'delivered' (last step)
    if (userRole === 'kasir_cabang') {
      return currentStatus === 'arrived_at_store';
    }
    
    // Others (owner, admin, pengantaran) can move 1-4
    return currentIndex < TRACKING_STATUS_ORDER.length - 1;
  };

  const getNextStatus = (currentStatus: TrackingStatus): TrackingStatus | null => {
    const currentIndex = TRACKING_STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex < TRACKING_STATUS_ORDER.length - 1) {
      return TRACKING_STATUS_ORDER[currentIndex + 1];
    }
    return null;
  };

  const renderOrderCard = (order: Order) => {
    const nextStatus = order.tracking_status ? getNextStatus(order.tracking_status as TrackingStatus) : null;
    const canMove = order.tracking_status ? canMoveToNext(order.tracking_status as TrackingStatus) : false;
    const isPaid = order.payment_status === 'paid';

    return (
      <Card 
        key={order.id} 
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onViewDetail(order.id!)}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-xs font-medium text-primary">
              {order.order_number}
            </span>
            <Badge 
              variant={isPaid ? 'default' : 'secondary'} 
              className="text-[10px] px-1.5"
            >
              {isPaid ? 'Lunas' : 'Belum Lunas'}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1 text-foreground">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(order.delivery_date), 'dd MMM', { locale: localeId })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {canMove && nextStatus && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMoveOrder(order.id!, nextStatus);
              }}
            >
              <ChevronRight className="h-3 w-3 mr-1" />
              {getTrackingStatusLabel(nextStatus)}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {TRACKING_STATUS_ORDER.map((status) => {
        const columnOrders = getOrdersByTracking(status);
        
        return (
          <div key={status} className="flex flex-col">
            <Card className={cn(
              "border-t-4 flex flex-col h-full",
              getColumnColor(status)
            )}>
              <CardHeader className={cn("py-3 px-4", getColumnBg(status))}>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{getTrackingStatusLabel(status)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {columnOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-1">
                <ScrollArea className="h-[400px] pr-2">
                  {columnOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground text-xs py-8">
                      Tidak ada pesanan
                    </div>
                  ) : (
                    columnOrders.map(renderOrderCard)
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
