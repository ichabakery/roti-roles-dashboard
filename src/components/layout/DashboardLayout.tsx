
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, RoleType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Settings, Users, ShoppingBag, Landmark, CreditCard, ChefHat, BarChart, Database, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Mapping untuk menentukan menu mana yang ditampilkan berdasarkan role
const roleMenuMap: Record<RoleType, string[]> = {
  owner: ['dashboard', 'users', 'branches', 'products', 'cashier', 'production', 'inventory', 'reports', 'settings'],
  kepala_produksi: ['dashboard', 'production', 'inventory'],
  kasir_cabang: ['dashboard', 'cashier', 'inventory', 'reports'],
  admin_pusat: ['dashboard', 'products', 'branches', 'inventory', 'reports', 'bundles']
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children
}) => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    return null; // Seharusnya tidak terjadi karena ada protected route
  }

  // Menu items berdasarkan role
  const allowedMenus = roleMenuMap[user.role] || [];
  const menuItems = [{
    title: "Dashboard",
    url: "/dashboard",
    icon: Landmark,
    access: allowedMenus.includes('dashboard')
  }, {
    title: "Pengguna",
    url: "/users",
    icon: Users,
    access: allowedMenus.includes('users')
  }, {
    title: "Cabang",
    url: "/branches",
    icon: Landmark,
    access: allowedMenus.includes('branches')
  }, {
    title: "Produk",
    url: "/products",
    icon: ShoppingBag,
    access: allowedMenus.includes('products')
  }, {
    title: "Bundling Produk",
    url: "/bundles",
    icon: Database,
    access: allowedMenus.includes('bundles')
  }, {
    title: "Kasir",
    url: "/cashier",
    icon: CreditCard,
    access: allowedMenus.includes('cashier')
  }, {
    title: "Produksi",
    url: "/production",
    icon: ChefHat,
    access: allowedMenus.includes('production')
  }, {
    title: "Stok",
    url: "/inventory",
    icon: Database,
    access: allowedMenus.includes('inventory')
  }, {
    title: "Laporan",
    url: "/reports",
    icon: BarChart,
    access: allowedMenus.includes('reports')
  }, {
    title: "Pengaturan",
    url: "/settings",
    icon: Settings,
    access: allowedMenus.includes('settings')
  }];

  // Filter hanya menu yang diperbolehkan
  const filteredMenu = menuItems.filter(item => item.access);
  
  // Handle menu click
  const handleMenuClick = (url: string) => {
    navigate(url);
    toast({
      title: "Navigasi",
      description: `Halaman ${url.replace('/', '')} dibuka`,
    });
  };
  
  return <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="px-2 flex justify-center items-center h-16 border-b">
            <div className="text-xl font-bold text-sidebar-foreground">
              Bakery Guru
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMenu.map(item => <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Button variant="ghost" className="w-full justify-start" onClick={() => handleMenuClick(item.url)}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-2">
                <div className="rounded-full bg-sidebar-accent p-1">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">
                    {user.name}
                  </span>
                  <span className="text-xs text-sidebar-foreground/70">
                    {user.role === 'owner' ? 'Pemilik' : 
                     user.role === 'kepala_produksi' ? 'Kepala Produksi' : 
                     user.role === 'kasir_cabang' ? 'Kasir Cabang' : 'Admin Pusat'}
                    {user.branchId && user.role === 'kasir_cabang' && (
                      user.branchId === '00000000-0000-0000-0000-000000000001' ? ' - Pusat' : 
                      user.branchId === '00000000-0000-0000-0000-000000000002' ? ' - Selatan' : 
                      user.branchId === '00000000-0000-0000-0000-000000000003' ? ' - Timur' : ''
                    )}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => logout()} size="sm">
                <LogOut className="mr-2 h-4 w-4" /> Keluar
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1">
          <div className="border-b">
            <header className="flex h-14 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="font-semibold text-lg">Icha Bakery Management System</h1>
              </div>
            </header>
          </div>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>;
};
