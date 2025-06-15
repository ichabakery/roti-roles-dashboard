
import { MapPin } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { User } from '@/contexts/AuthContext';
import { menuItems } from './MenuItems';
import NotificationIcon from '@/components/notifications/NotificationIcon';

interface TopBarProps {
  user: User | null;
  branchDisplayName: string;
}

export const TopBar = ({ user, branchDisplayName }: TopBarProps) => {
  const location = useLocation();

  const getCurrentPageName = () => {
    return menuItems.find(item => item.href === location.pathname)?.name || 'Dashboard';
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {getCurrentPageName()}
          </h2>
          <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="font-medium">📍 {branchDisplayName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationIcon unreadCount={0} />
        </div>
      </div>
    </header>
  );
};
