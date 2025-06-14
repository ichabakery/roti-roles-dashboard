
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Key, LogOut, Save } from 'lucide-react';

export const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password baru dan konfirmasi password tidak cocok",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    // Simulate password change
    toast({
      title: "Berhasil",
      description: "Password berhasil diubah",
    });

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogoutAllDevices = () => {
    toast({
      title: "Berhasil",
      description: "Berhasil keluar dari semua perangkat",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Ubah Password
          </CardTitle>
          <CardDescription>
            Ubah password untuk meningkatkan keamanan akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Saat Ini</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              placeholder="Masukkan password saat ini"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              placeholder="Masukkan password baru"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              placeholder="Ulangi password baru"
            />
          </div>

          <Button onClick={handleChangePassword} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Ubah Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Keamanan Sesi
          </CardTitle>
          <CardDescription>
            Kelola sesi login dan keamanan akun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Keluar dari Semua Perangkat</h4>
              <p className="text-sm text-muted-foreground">
                Paksa keluar dari semua perangkat yang sedang login
              </p>
            </div>
            <Button variant="outline" onClick={handleLogoutAllDevices} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Keluar Semua
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Tips Keamanan</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gunakan password yang kuat dan unik</li>
              <li>• Jangan bagikan kredensial login Anda</li>
              <li>• Keluar dari akun setelah selesai menggunakan</li>
              <li>• Ubah password secara berkala</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
