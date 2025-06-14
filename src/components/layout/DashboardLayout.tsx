import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const navigation: NavItem[] = [
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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeNavItemStyles = "bg-muted text-primary";

  return (
    <div className="flex h-screen bg-gray-100 text-gray-700">
      {/* Mobile menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden absolute top-4 left-4">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="px-4 py-6 text-center border-b">
              <h2 className="text-lg font-semibold">Toko Roti Enak</h2>
              <p className="text-sm text-gray-500">Selamat datang, {user?.email}</p>
            </div>
            <nav className="flex flex-col flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "justify-start px-4",
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
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="w-64 hidden md:flex flex-col border-r">
        <div className="px-4 py-6 text-center border-b">
          <h2 className="text-lg font-semibold">Toko Roti Enak</h2>
          <p className="text-sm text-gray-500">Selamat datang, {user?.email}</p>
        </div>
        <nav className="flex flex-col flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "justify-start px-4",
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
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
};
