
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, History } from 'lucide-react';
import { DeliveryTab } from '@/hooks/useDeliveryOrders';

interface DeliveryTabsProps {
  activeTab: DeliveryTab;
  onTabChange: (tab: DeliveryTab) => void;
  counts: {
    pending: number;
    in_transit: number;
    history: number;
  };
}

const TABS: { id: DeliveryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pending', label: 'Menunggu', icon: Package },
  { id: 'in_transit', label: 'Diantar', icon: Truck },
  { id: 'history', label: 'Riwayat', icon: History }
];

export const DeliveryTabs: React.FC<DeliveryTabsProps> = ({
  activeTab,
  onTabChange,
  counts
}) => {
  return (
    <div className="flex border-b bg-background sticky top-[73px] z-40">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const count = counts[tab.id];
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 px-2
              text-sm font-medium transition-colors relative
              ${isActive 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {count > 0 && (
              <Badge 
                variant={isActive ? 'default' : 'secondary'} 
                className="h-5 min-w-[20px] px-1.5 text-xs"
              >
                {count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};
