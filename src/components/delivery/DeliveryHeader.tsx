
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';

interface DeliveryHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DeliveryHeader: React.FC<DeliveryHeaderProps> = ({
  onRefresh,
  isRefreshing = false
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-xl font-bold">Tracking Pengantaran</h1>
          <p className="text-sm text-muted-foreground">
            Halo, {user?.name || 'Kurir'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
};
