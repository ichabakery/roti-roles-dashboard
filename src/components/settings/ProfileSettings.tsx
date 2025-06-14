
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    position: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Simulate saving profile data
    toast({
      title: "Berhasil",
      description: "Profil berhasil diperbarui",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary p-3">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'owner' ? 'Pemilik' : 
               user?.role === 'kepala_produksi' ? 'Kepala Produksi' : 
               user?.role === 'kasir_cabang' ? 'Kasir Cabang' : 'Admin Pusat'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@example.com"
              className="pl-10"
              disabled // Email usually shouldn't be changed easily
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Posisi</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="Jabatan atau posisi"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
};
