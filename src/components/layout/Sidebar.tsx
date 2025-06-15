
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@/contexts/AuthContext';
import { menuItems, MenuItem } from './MenuItems';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen, user, onLogout }: SidebarProps) => {
  const location = useLocation();

  const visibleMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActivePath = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className={`bg-white shadow-sm border-r transition-all duration-300 ${
      sidebarOpen ? 'w-64' : 'w-16'
    } flex flex-col`}>
      {/* Logo/Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">Toko Roti</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && (
                <span className="ml-3 text-sm font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <UserProfile user={user} sidebarOpen={sidebarOpen} onLogout={onLogout} />
    </div>
  );
};
