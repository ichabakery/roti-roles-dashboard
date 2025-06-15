import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, RoleType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Home,
  Package,
  Archive,
  Package2,
  Factory,
  Calculator,
  BarChart3,
  Users,
  Building,
  Settings,
  Menu,
  LogOut
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<any>;
}

const allNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Produk Sederhana', href: '/products', icon: Package },
  { name: 'Produk Lengkap', href: '/enhanced-products', icon: Archive },
  { name: 'Inventory', href: '/inventory', icon: Package2 },
  { name: 'Produksi', href: '/production', icon: Factory },
  { name: 'Kasir', href: '/cashier', icon: Calculator },
  { name: 'Laporan', href: '/reports', icon: BarChart3 },
  { name: 'Pengguna', href: '/users', icon: Users },
  { name: 'Cabang', href: '/branches', icon: Building },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

const getNavigationForRole = (role: RoleType): NavItem[] => {
  switch (role) {
    case 'kasir_cabang':
      return allNavigation.filter(item => 
        ['Dashboard', 'Kasir', 'Produksi', 'Inventory', 'Laporan', 'Pengaturan'].includes(item.name)
      );
    case 'kepala_produksi':
      return allNavigation.filter(item =>
        ['Dashboard', 'Produksi', 'Inventory', 'Pengaturan'].includes(item.name)
      );
    case 'admin_pusat':
      return allNavigation.filter(item =>
        ['Dashboard', 'Produk Sederhana', 'Produk Lengkap', 'Inventory', 'Laporan', 'Pengguna', 'Cabang', 'Pengaturan'].includes(item.name)
      );
    case 'owner':
    default:
      return allNavigation;
  }
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = user ? getNavigationForRole(user.role) : allNavigation;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeNavItemStyles = "bg-bakery-600 text-white font-semibold";

  return (
    <div className="flex h-screen bg-gray-50 text-gray-700">
      {/* Mobile menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden fixed top-4 left-4 z-50 text-bakery-700">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-bakery-700">
          <div className="flex flex-col h-full">
            <div className="px-4 py-6 text-center border-b border-bakery-600">
              <h2 className="text-lg font-semibold text-white">Toko Roti Enak</h2>
              <p className="text-sm text-bakery-200">Selamat datang, {user?.email}</p>
            </div>
            <nav className="flex flex-col flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "justify-start px-4 text-bakery-100 hover:bg-bakery-600 hover:text-white",
                    location.pathname === item.href ? activeNavItemStyles : ""
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Button>
              ))}
            </nav>
            <div className="p-4">
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-bakery-500 text-bakery-100 hover:bg-bakery-600 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - Fixed positioning */}
      <aside className="w-64 hidden md:flex flex-col border-r bg-bakery-700 fixed left-0 top-0 h-screen z-40">
        <div className="px-4 py-6 text-center border-b border-bakery-600">
          <h2 className="text-lg font-semibold text-white">Toko Roti Enak</h2>
          <p className="text-sm text-bakery-200">Selamat datang, {user?.email}</p>
        </div>
        <nav className="flex flex-col flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "justify-start px-4 text-bakery-100 hover:bg-bakery-600 hover:text-white",
                location.pathname === item.href ? activeNavItemStyles : ""
              )}
              onClick={() => navigate(item.href)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </Button>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <Button 
            variant="outline" 
            className="w-full bg-transparent border-bakery-500 text-bakery-100 hover:bg-bakery-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content - Add left margin to account for fixed sidebar */}
      <main className="flex-1 p-4 bg-white md:ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
