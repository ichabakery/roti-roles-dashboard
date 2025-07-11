
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/contexts/AuthContext';
import { menuItems, MenuItem } from './MenuItems';
import { UserProfile } from './UserProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen, user, onLogout }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const visibleMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActivePath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        isMobile ? (
          sidebarOpen 
            ? "fixed inset-y-0 left-0 z-50 w-64"
            : "hidden"
        ) : (
          sidebarOpen ? "w-64" : "w-16"
        )
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <h2 className="text-xl font-bold text-foreground">
              Roti Dashboard
            </h2>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isMobile ? (
              <X size={20} />
            ) : (
              sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);
            
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-lg transition-colors text-left",
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="ml-3 font-medium truncate">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border p-4">
          <UserProfile 
            user={user} 
            onLogout={onLogout} 
            sidebarOpen={sidebarOpen}
          />
        </div>
      </div>
    </>
  );
};
