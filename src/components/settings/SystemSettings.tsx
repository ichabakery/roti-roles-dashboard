
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Monitor, Palette, Globe, Save } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'id',
    autoSave: true,
    showTutorial: true,
    compactMode: false,
    highContrast: false,
  });

  const handleSelectChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [field]: checked }));
  };

  const handleSave = () => {
    toast({
      title: "Berhasil",
      description: "Pengaturan sistem berhasil diperbarui",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <h4 className="font-medium">Tampilan</h4>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => handleSelectChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Terang</SelectItem>
                  <SelectItem value="dark">Gelap</SelectItem>
                  <SelectItem value="system">Mengikuti Sistem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Bahasa</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSelectChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <h4 className="font-medium">Perilaku Sistem</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Penyimpanan Otomatis</Label>
                <p className="text-sm text-muted-foreground">
                  Simpan perubahan secara otomatis tanpa konfirmasi
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleSwitchChange('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tampilkan Tutorial</Label>
                <p className="text-sm text-muted-foreground">
                  Tampilkan tips dan panduan penggunaan
                </p>
              </div>
              <Switch
                checked={settings.showTutorial}
                onCheckedChange={(checked) => handleSwitchChange('showTutorial', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode Kompak</Label>
                <p className="text-sm text-muted-foreground">
                  Tampilan lebih padat untuk layar kecil
                </p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleSwitchChange('compactMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Kontras Tinggi</Label>
                <p className="text-sm text-muted-foreground">
                  Meningkatkan kontras untuk aksesibilitas
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSwitchChange('highContrast', checked)}
              />
            </div>
          </div>
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
