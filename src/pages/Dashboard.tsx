
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings, Users, ShoppingBag, Landmark, CreditCard, ChefHat, BarChart } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Quick access cards berdasarkan role
  const getQuickAccessCards = () => {
    switch (user?.role) {
      case 'owner':
        return [
          { title: 'Pengguna', description: 'Kelola akun & role', icon: <Users className="h-6 w-6" />, color: 'bg-blue-100', link: '/users' },
          { title: 'Laporan', description: 'Lihat laporan keuangan', icon: <BarChart className="h-6 w-6" />, color: 'bg-green-100', link: '/reports' },
          { title: 'Cabang', description: 'Kelola cabang toko', icon: <Landmark className="h-6 w-6" />, color: 'bg-purple-100', link: '/branches' },
          { title: 'Produk', description: 'Kelola data produk', icon: <ShoppingBag className="h-6 w-6" />, color: 'bg-yellow-100', link: '/products' },
        ];
      case 'kepala_produksi':
        return [
          { title: 'Produksi', description: 'Kelola permintaan produksi', icon: <ChefHat className="h-6 w-6" />, color: 'bg-orange-100', link: '/production' },
        ];
      case 'kasir_cabang':
        return [
          { title: 'Kasir', description: 'Mode transaksi penjualan', icon: <CreditCard className="h-6 w-6" />, color: 'bg-blue-100', link: '/cashier' },
          { title: 'Stok', description: 'Lihat stok tersedia', icon: <ShoppingBag className="h-6 w-6" />, color: 'bg-green-100', link: '/inventory' },
        ];
      case 'admin_pusat':
        return [
          { title: 'Produk', description: 'Kelola data produk', icon: <ShoppingBag className="h-6 w-6" />, color: 'bg-yellow-100', link: '/products' },
          { title: 'Cabang', description: 'Kelola data cabang', icon: <Landmark className="h-6 w-6" />, color: 'bg-purple-100', link: '/branches' },
        ];
      default:
        return [];
    }
  };

  const quickAccessCards = getQuickAccessCards();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickAccessCards.map((card, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-1">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Peran Anda</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                  {user?.role === 'owner' ? 'Pemilik' : 
                   user?.role === 'kepala_produksi' ? 'Kepala Produksi' :
                   user?.role === 'kasir_cabang' ? 'Kasir Cabang' : 'Admin Pusat'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Status</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  Online
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Waktu Login</span>
                <span className="text-muted-foreground">
                  {new Date().toLocaleString('id-ID')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panduan Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>Gunakan sidebar untuk navigasi antar modul</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>Akses hanya untuk modul sesuai peran Anda</span>
                </div>
                {user?.role === 'owner' && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Kelola pengguna dan peran di menu Pengguna</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
