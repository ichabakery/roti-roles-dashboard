
import { MapPin, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { User } from '@/contexts/AuthContext';
import { menuItems } from './MenuItems';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  user: User | null;
  branchDisplayName: string;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export const TopBar = ({ user, branchDisplayName, onToggleSidebar, isMobile }: TopBarProps) => {
  const location = useLocation();

  const getCurrentPageName = () => {
    return menuItems.find(item => item.href === location.pathname)?.name || 'Dashboard';
  };

  return (
    <header className="bg-card border-b border-border px-3 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && onToggleSidebar && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground capitalize">
              {getCurrentPageName()}
            </h2>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="font-medium">{branchDisplayName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <NotificationIcon unreadCount={0} />
        </div>
      </div>
    </header>
  );
};
