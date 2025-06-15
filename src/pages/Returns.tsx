
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CreateReturnDialog } from '@/components/returns/CreateReturnDialog';
import { ReturnsList } from '@/components/returns/ReturnsList';
import { ReturnStats } from '@/components/returns/ReturnStats';

const Returns = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  // Cek permission berdasarkan role
  const canCreateReturn = user?.role === 'kasir_cabang' || user?.role === 'owner' || user?.role === 'admin_pusat';
  const canApproveReturn = user?.role === 'owner' || user?.role === 'admin_pusat';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Retur</h1>
            <p className="text-muted-foreground">
              Kelola retur produk dari pelanggan dan internal
            </p>
          </div>
          {canCreateReturn && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Retur Baru
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <ReturnStats />

        {/* Returns List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daftar Retur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnsList 
              canApprove={canApproveReturn}
              userRole={user?.role}
            />
          </CardContent>
        </Card>

        {/* Create Return Dialog */}
        <CreateReturnDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          userRole={user?.role}
        />
      </div>
    </DashboardLayout>
  );
};

export default Returns;
