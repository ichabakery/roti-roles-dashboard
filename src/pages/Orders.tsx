import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Calendar, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  // Empty orders array - no mock data
  const orders: any[] = [];

  const handleCreateOrder = () => {
    setShowNewOrderDialog(true);
    // TODO: Implement order creation dialog
    console.log('Create new order clicked');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      in_production: { label: 'Produksi', variant: 'outline' as const },
      ready: { label: 'Siap', variant: 'secondary' as const },
      completed: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manajemen Pesanan</h1>
            <p className="text-muted-foreground">Kelola pesanan pelanggan dan jadwal pengiriman</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Pesanan Baru
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari nama pelanggan atau nomor pesanan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="in_production">Produksi</SelectItem>
                  <SelectItem value="ready">Siap</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Order Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-3">
            <TabsTrigger value="list">Daftar Pesanan</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
            <TabsTrigger value="stats" className="hidden sm:flex">Statistik</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Plus className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Belum ada pesanan</p>
                    <Button onClick={handleCreateOrder}>
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Pesanan Pertama
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                          <CardDescription>{order.customerName} • {order.customerPhone}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-foreground">Cabang Pemesan</p>
                          <p className="text-muted-foreground">{order.branchName}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Pengambilan/Pengiriman</p>
                          <p className="text-muted-foreground">
                            {order.pickupBranch || order.deliveryAddress || 'Delivery'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Tanggal Pengiriman</p>
                          <p className="text-muted-foreground">{formatDate(order.deliveryDate)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Total Pembayaran</p>
                          <p className="text-muted-foreground">
                            {formatCurrency(order.totalAmount)}
                            {order.paymentType === 'dp' && order.dpAmount && (
                              <span className="block text-xs text-orange-600">
                                DP: {formatCurrency(order.dpAmount)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="font-medium text-foreground mb-2">Item Pesanan:</p>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-foreground">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Kalender Pesanan</CardTitle>
                <CardDescription>View pesanan berdasarkan tanggal pengiriman</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>Kalender view akan segera hadir</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Bulan ini</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Menunggu Konfirmasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Perlu tindakan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Dalam Produksi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Sedang dikerjakan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(0)}</div>
                  <p className="text-xs text-muted-foreground">Bulan ini</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Orders;