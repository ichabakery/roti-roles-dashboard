
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building, MapPin, Phone, Clock, Save } from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    businessName: 'Icha Bakery',
    address: 'Jl. Raya Bakery No. 123',
    phone: '021-12345678',
    email: 'info@ichabakery.com',
    description: 'Toko roti dan kue terbaik di kota',
    operatingHours: '07:00 - 21:00',
    currency: 'IDR',
    taxRate: '11',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Berhasil",
      description: "Pengaturan bisnis berhasil diperbarui",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Nama Toko</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon Toko</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Alamat Toko</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="pl-10"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Toko</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="operatingHours">Jam Operasional</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="operatingHours"
              value={formData.operatingHours}
              onChange={(e) => handleInputChange('operatingHours', e.target.value)}
              className="pl-10"
              placeholder="07:00 - 21:00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Mata Uang</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            placeholder="IDR"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRate">Tarif Pajak (%)</Label>
          <Input
            id="taxRate"
            type="number"
            value={formData.taxRate}
            onChange={(e) => handleInputChange('taxRate', e.target.value)}
            placeholder="11"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Deskripsi Toko</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
};
