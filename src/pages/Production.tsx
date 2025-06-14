
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Coffee } from 'lucide-react';

const Production = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Produksi</h2>
            <p className="text-muted-foreground">
              Kelola permintaan dan produksi roti
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Riwayat Produksi
            </Button>
            <Button>
              <Coffee className="mr-2 h-4 w-4" />
              Mulai Produksi Baru
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                <Coffee className="mx-auto h-12 w-12 mb-4" />
                <p>Belum ada permintaan produksi</p>
                <p className="text-sm mt-2">Permintaan produksi akan muncul di sini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Production;
