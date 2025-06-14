
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings, Users, ShoppingBag, Landmark, CreditCard, ChefHat, BarChart, Database } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Quick access cards berdasarkan role
  const getQuickAccessCards = () => {
    switch (user?.role) {
      case 'owner':
        return [
          { 
            title: 'Produk', 
            description: 'Kelola data master produk', 
            icon: <ShoppingBag className="h-6 w-6" />, 
            color: 'bg-blue-100 text-blue-600', 
            link: '/products',
            priority: 1 
          },
          { 
            title: 'Cabang', 
            description: 'Kelola cabang toko', 
            icon: <Landmark className="h-6 w-6" />, 
            color: 'bg-purple-100 text-purple-600', 
            link: '/branches',
            priority: 2 
          },
          { 
            title: 'Pengguna', 
            description: 'Kelola akun & role', 
            icon: <Users className="h-6 w-6" />, 
            color: 'bg-green-100 text-green-600', 
            link: '/users',
            priority: 3 
          },
          { 
            title: 'Stok', 
            description: 'Kelola inventory produk', 
            icon: <Database className="h-6 w-6" />, 
            color: 'bg-orange-100 text-orange-600', 
            link: '/inventory',
            priority: 4 
          },
          { 
            title: 'Kasir', 
            description: 'Test transaksi penjualan', 
            icon: <CreditCard className="h-6 w-6" />, 
            color: 'bg-emerald-100 text-emerald-600', 
            link: '/cashier',
            priority: 5 
          },
          { 
            title: 'Laporan', 
            description: 'Lihat laporan keuangan', 
            icon: <BarChart className="h-6 w-6" />, 
            color: 'bg-red-100 text-red-600', 
            link: '/reports',
            priority: 6 
          },
        ];
      case 'kepala_produksi':
        return [
          { 
            title: 'Produksi', 
            description: 'Kelola permintaan produksi', 
            icon: <ChefHat className="h-6 w-6" />, 
            color: 'bg-orange-100 text-orange-600', 
            link: '/production',
            priority: 1 
          },
          { 
            title: 'Stok', 
            description: 'Lihat stok produk', 
            icon: <Database className="h-6 w-6" />, 
            color: 'bg-blue-100 text-blue-600', 
            link: '/inventory',
            priority: 2 
          },
        ];
      case 'kasir_cabang':
        return [
          { 
            title: 'Kasir', 
            description: 'Mode transaksi penjualan', 
            icon: <CreditCard className="h-6 w-6" />, 
            color: 'bg-blue-100 text-blue-600', 
            link: '/cashier',
            priority: 1 
          },
          { 
            title: 'Stok', 
            description: 'Lihat stok tersedia', 
            icon: <Database className="h-6 w-6" />, 
            color: 'bg-green-100 text-green-600', 
            link: '/inventory',
            priority: 2 
          },
          { 
            title: 'Laporan', 
            description: 'Lihat laporan penjualan', 
            icon: <BarChart className="h-6 w-6" />, 
            color: 'bg-purple-100 text-purple-600', 
            link: '/reports',
            priority: 3 
          },
        ];
      case 'admin_pusat':
        return [
          { 
            title: 'Produk', 
            description: 'Kelola data produk', 
            icon: <ShoppingBag className="h-6 w-6" />, 
            color: 'bg-yellow-100 text-yellow-600', 
            link: '/products',
            priority: 1 
          },
          { 
            title: 'Cabang', 
            description: 'Kelola data cabang', 
            icon: <Landmark className="h-6 w-6" />, 
            color: 'bg-purple-100 text-purple-600', 
            link: '/branches',
            priority: 2 
          },
          { 
            title: 'Stok', 
            description: 'Kelola inventory', 
            icon: <Database className="h-6 w-6" />, 
            color: 'bg-blue-100 text-blue-600', 
            link: '/inventory',
            priority: 3 
          },
        ];
      default:
        return [];
    }
  };

  const quickAccessCards = getQuickAccessCards().sort((a, b) => a.priority - b.priority);

  const handleCardClick = (link: string) => {
    navigate(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Selamat Datang, {user?.name}!</h2>
            <p className="text-muted-foreground mt-2">
              {user?.role === 'owner' ? 'Mulai testing aplikasi sesuai rencana prioritas' : 
               user?.role === 'kepala_produksi' ? 'Kelola produksi dan monitor stok' :
               user?.role === 'kasir_cabang' ? 'Lakukan transaksi dan monitor stok' : 
               'Kelola produk dan cabang'}
            </p>
          </div>
        </div>

        {user?.role === 'owner' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">🎯 Rencana Testing Aplikasi</CardTitle>
              <CardDescription>
                Ikuti urutan testing berikut untuk memastikan semua fitur berfungsi dengan baik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <span><strong>Produk</strong> - Tambah 3-5 produk roti dengan harga berbeda</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center text-xs font-bold">2</div>
                  <span><strong>Cabang</strong> - Tambah 2-3 cabang dengan informasi lengkap</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center text-xs font-bold">3</div>
                  <span><strong>Pengguna</strong> - Tambah user dengan role kasir_cabang</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center text-xs font-bold">4</div>
                  <span><strong>Stok</strong> - Tambah inventory untuk produk di berbagai cabang</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center text-xs font-bold">5</div>
                  <span><strong>Kasir</strong> - Test transaksi dengan berbagai produk dan metode bayar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted-foreground text-background flex items-center justify-center text-xs font-bold">6</div>
                  <span><strong>Laporan</strong> - Verifikasi data transaksi dan filter laporan</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickAccessCards.map((card, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleCardClick(card.link)}
            >
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-1">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
                {user?.role === 'owner' && card.priority && (
                  <div className="mt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Prioritas {card.priority}
                    </span>
                  </div>
                )}
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
                  Online & Ready untuk Testing
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Cabang</span>
                <span className="text-muted-foreground">
                  {user?.branchId && user?.role === 'kasir_cabang' ? (
                    user.branchId === '00000000-0000-0000-0000-000000000001' ? 'Pusat' : 
                    user.branchId === '00000000-0000-0000-0000-000000000002' ? 'Selatan' : 
                    user.branchId === '00000000-0000-0000-0000-000000000003' ? 'Timur' : 'Tidak Diketahui'
                  ) : user?.role === 'owner' ? 'Semua Cabang' : 'Pusat'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Waktu Login</span>
                <span className="text-muted-foreground">
                  {new Date().toLocaleString('id-ID')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panduan Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>Klik card di atas untuk mulai testing fitur</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>Ikuti urutan prioritas untuk hasil testing optimal</span>
                </div>
                {user?.role === 'owner' && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Test CRUD operations di setiap modul</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Verifikasi role-based access dengan logout/login role lain</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {user?.role === 'owner' && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">⚠️ Catatan Penting untuk Testing</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700 space-y-2 text-sm">
              <p>• Database sudah dibersihkan dari data dummy - siap untuk testing dengan data asli</p>
              <p>• Semua tabel sudah dikonfigurasi dengan Row Level Security yang benar</p>
              <p>• Foreign key relationships sudah diperbaiki untuk integritas data</p>
              <p>• Laporkan bug atau error yang ditemukan selama testing</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
