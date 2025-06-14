
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, AlertTriangle, ShoppingCart, Save } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlert: true,
    newOrderAlert: true,
    paymentAlert: true,
    systemUpdates: false,
    marketingEmails: false,
    weeklyReport: true,
  });

  const handleNotificationChange = (field: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: checked }));
  };

  const handleSave = () => {
    toast({
      title: "Berhasil",
      description: "Pengaturan notifikasi berhasil diperbarui",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifikasi Umum
          </CardTitle>
          <CardDescription>
            Atur preferensi notifikasi dasar sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifikasi Email</Label>
              <p className="text-sm text-muted-foreground">
                Terima notifikasi melalui email
              </p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifikasi Push</Label>
              <p className="text-sm text-muted-foreground">
                Terima notifikasi real-time di browser
              </p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Peringatan Bisnis
          </CardTitle>
          <CardDescription>
            Notifikasi terkait operasional toko dan inventory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Peringatan Stok Menipis</Label>
              <p className="text-sm text-muted-foreground">
                Notifikasi ketika stok produk hampir habis
              </p>
            </div>
            <Switch
              checked={notifications.lowStockAlert}
              onCheckedChange={(checked) => handleNotificationChange('lowStockAlert', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pesanan Baru</Label>
              <p className="text-sm text-muted-foreground">
                Notifikasi untuk pesanan atau transaksi baru
              </p>
            </div>
            <Switch
              checked={notifications.newOrderAlert}
              onCheckedChange={(checked) => handleNotificationChange('newOrderAlert', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pembayaran</Label>
              <p className="text-sm text-muted-foreground">
                Notifikasi untuk pembayaran dan transaksi keuangan
              </p>
            </div>
            <Switch
              checked={notifications.paymentAlert}
              onCheckedChange={(checked) => handleNotificationChange('paymentAlert', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Laporan & Pembaruan
          </CardTitle>
          <CardDescription>
            Pengaturan untuk laporan berkala dan pembaruan sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Laporan Mingguan</Label>
              <p className="text-sm text-muted-foreground">
                Terima ringkasan penjualan dan performa mingguan
              </p>
            </div>
            <Switch
              checked={notifications.weeklyReport}
              onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Pembaruan Sistem</Label>
              <p className="text-sm text-muted-foreground">
                Notifikasi untuk fitur baru dan pembaruan sistem
              </p>
            </div>
            <Switch
              checked={notifications.systemUpdates}
              onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Marketing</Label>
              <p className="text-sm text-muted-foreground">
                Terima tips bisnis dan penawaran khusus
              </p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
};
