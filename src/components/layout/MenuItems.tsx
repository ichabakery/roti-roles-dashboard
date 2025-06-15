
import { 
  LayoutDashboard, 
  Users, 
  PackageOpen, 
  Warehouse, 
  Factory, 
  ShoppingCart, 
  MapPin, 
  BarChart3, 
  Settings,
  RotateCcw
} from 'lucide-react';

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export const menuItems: MenuItem[] = [
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
    roles: ['owner', 'admin_pusat', 'kasir_cabang']
  },
  { 
    name: 'Pengaturan', 
    href: '/settings', 
    icon: Settings,
    roles: ['owner', 'admin_pusat', 'kepala_produksi', 'kasir_cabang']
  },
];
