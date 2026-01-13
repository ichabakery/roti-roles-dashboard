
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ChevronRight,
  Package,
  Truck,
  Store,
  CheckCircle2,
  Factory,
  Hand,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DeliveryOrder } from '@/hooks/useDeliveryOrders';

interface DeliveryOrderCardProps {
  order: DeliveryOrder;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onAssignToSelf?: (orderId: string) => void;
  isUpdating?: boolean;
  isKurir?: boolean;
}

const TRACKING_STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  nextStatus?: string;
  nextLabel?: string;
}> = {
  in_production: {
    label: 'Dalam Produksi',
    icon: Factory,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    nextStatus: 'ready_to_ship',
    nextLabel: 'Siap Kirim'
  },
  ready_to_ship: {
    label: 'Siap Kirim',
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    nextStatus: 'in_transit',
    nextLabel: 'Mulai Antar'
  },
  in_transit: {
    label: 'Dalam Perjalanan',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    nextStatus: 'arrived_at_store',
    nextLabel: 'Tiba di Toko'
  },
  arrived_at_store: {
    label: 'Tiba di Toko',
    icon: Store,
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    nextStatus: 'delivered',
    nextLabel: 'Selesai'
  },
  delivered: {
    label: 'Selesai',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-200'
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const DeliveryOrderCard: React.FC<DeliveryOrderCardProps> = ({
  order,
  onUpdateStatus,
  onAssignToSelf,
  isUpdating = false,
  isKurir = false
}) => {
  const config = TRACKING_STATUS_CONFIG[order.tracking_status] || TRACKING_STATUS_CONFIG.in_production;
  const StatusIcon = config.icon;

  const handleNextStatus = () => {
    if (config.nextStatus) {
      onUpdateStatus(order.id, config.nextStatus);
    }
  };

  const handleAssignToSelf = () => {
    if (onAssignToSelf) {
      onAssignToSelf(order.id);
    }
  };

  // Untuk kurir di tab pending, tampilkan tombol "Ambil Pesanan"
  const showAssignButton = isKurir && !order.courier_id && order.tracking_status === 'ready_to_ship';
  
  // Untuk kurir, hanya tampilkan tombol next status jika sudah jadi miliknya
  const canShowNextStatus = isKurir 
    ? order.courier_id && config.nextStatus 
    : config.nextStatus;

  return (
    <Card className="mb-3 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{order.order_number}</span>
            <Badge 
              variant="outline" 
              className={`${config.color} text-xs`}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          {order.payment_status !== 'paid' && (
            <Badge variant="destructive" className="text-xs">
              Belum Lunas
            </Badge>
          )}
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium">{order.branch_name}</span>
          </div>
          
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a 
                href={`tel:${order.customer_phone}`} 
                className="hover:text-primary underline"
              >
                {order.customer_phone}
              </a>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              Kirim: {format(new Date(order.delivery_date), 'EEEE, d MMM yyyy', { locale: id })}
            </span>
          </div>

          {order.delivery_address && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              📍 {order.delivery_address}
            </div>
          )}

          {/* Courier Info */}
          {order.courier_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Kurir:</span>
              <span className="font-medium text-primary">{order.courier_name}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-primary">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          {/* Tombol Ambil Pesanan untuk kurir */}
          {showAssignButton && (
            <Button 
              size="sm" 
              onClick={handleAssignToSelf}
              disabled={isUpdating}
              className="min-w-[140px] bg-green-600 hover:bg-green-700"
            >
              <Hand className="w-4 h-4 mr-1" />
              Ambil Pesanan
            </Button>
          )}

          {/* Tombol update status */}
          {canShowNextStatus && !showAssignButton && (
            <Button 
              size="sm" 
              onClick={handleNextStatus}
              disabled={isUpdating || (config.nextStatus === 'delivered' && order.payment_status !== 'paid')}
              className="min-w-[120px]"
            >
              {config.nextLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mt-3 text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
            📝 {order.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
