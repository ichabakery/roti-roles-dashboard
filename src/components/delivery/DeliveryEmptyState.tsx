
import React from 'react';
import { Package, Truck, CheckCircle2 } from 'lucide-react';
import { DeliveryTab } from '@/hooks/useDeliveryOrders';

interface DeliveryEmptyStateProps {
  tab: DeliveryTab;
}

const EMPTY_STATES: Record<DeliveryTab, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}> = {
  pending: {
    icon: Package,
    title: 'Tidak Ada Pesanan Menunggu',
    description: 'Semua pesanan sudah dalam proses pengiriman atau selesai'
  },
  in_transit: {
    icon: Truck,
    title: 'Tidak Ada Pesanan Diantar',
    description: 'Belum ada pesanan yang sedang dalam perjalanan'
  },
  history: {
    icon: CheckCircle2,
    title: 'Belum Ada Riwayat',
    description: 'Pesanan yang sudah selesai akan muncul di sini'
  }
};

export const DeliveryEmptyState: React.FC<DeliveryEmptyStateProps> = ({ tab }) => {
  const config = EMPTY_STATES[tab];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {config.description}
      </p>
    </div>
  );
};
