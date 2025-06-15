import { useState } from 'react';
import { Button } from '@/components/ui/button';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Warehouse, 
  Factory, 
  ShoppingCart, 
  MapPin, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X,
  PackageOpen,
  RotateCcw
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      roles: ['owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang']
    },
    { 
      name: 'Manajemen Pengguna', 
      href: '/users', 
      icon: Users,
      roles: ['owner', 'admin_pusat']
    },
    { 
      name: 'Produk Lengkap', 
      href: '/enhanced-products', 
      icon: PackageOpen,
      roles: ['owner', 'admin_pusat']
    },
    { 
      name: 'Inventori', 
      href: '/inventory', 
      icon: Warehouse,
      roles: ['owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang']
    },
    { 
      name: 'Produksi', 
      href: '/production', 
      icon: Factory,
      roles: ['owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang']
    },
    { 
      name: 'Kasir', 
      href: '/cashier', 
      icon: ShoppingCart,
      roles: ['kasir_cabang', 'owner', 'admin_pusat']
    },
    { 
      name: 'Retur', 
      href: '/returns', 
      icon: RotateCcw,
      roles: ['owner', 'admin_pusat', 'kasir_cabang']
    },
    { 
      name: 'Cabang', 
      href: '/branches', 
      icon: MapPin,
      roles: ['owner', 'admin_pusat']
    },
    { 
      name: 'Laporan', 
      href: '/reports', 
      icon: BarChart3,
      roles: ['owner', 'admin_pusat']
    },
    { 
      name: 'Pengaturan', 
      href: '/settings', 
      icon: Settings,
      roles: ['owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang']
    },
  ];

  const visibleMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActivePath = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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
        <div className="p-4 border-t">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${
              !sidebarOpen ? 'px-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {menuItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationIcon unreadCount={0} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
