import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Factory, Package, AlertCircle } from 'lucide-react';
import { useProduction } from '@/hooks/useProduction';
import { useBranches } from '@/hooks/useBranches';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

export function ProductionPanel() {
  const { productionRequests, loading, updateProductionRequestStatus } = useProduction();
  const { branches } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'menunggu':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'diproses':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'siap':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dikirim':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'selesai':
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'in_progress':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string, quantityProduced?: number) => {
    try {
      // Map new status values to existing ones for now
      let mappedStatus = newStatus;
      if (newStatus === 'siap') mappedStatus = 'completed';
      if (newStatus === 'dikirim') mappedStatus = 'completed';
      
      await updateProductionRequestStatus(requestId, mappedStatus as any, quantityProduced);
      
      if (newStatus === 'siap') {
        toast({
          title: "Status Diperbarui",
          description: "Notifikasi telah dikirim ke cabang bahwa produk sudah siap.",
        });
      } else if (newStatus === 'dikirim') {
        toast({
          title: "Status Diperbarui", 
          description: "Produk telah dikirim ke cabang.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengubah status produksi.",
      });
    }
  };

  // Filter requests by branch and date
  const filteredRequests = productionRequests.filter(request => {
    const matchesBranch = !selectedBranch || request.branch_id === selectedBranch;
    const matchesDate = !selectedDate || request.production_date === selectedDate;
    return matchesBranch && matchesDate;
  });

  // Group by due date
  const groupedRequests = filteredRequests.reduce((acc, request) => {
    const date = request.production_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(request);
    return acc;
  }, {} as Record<string, typeof productionRequests>);

  if (loading) {
    return <div className="text-center py-8">Memuat data produksi...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="h-5 w-5" />
              Panel Kepala Produksi
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Filter Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua cabang</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter Tanggal Produksi</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Requests */}
      {Object.keys(groupedRequests).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Permintaan Produksi</h3>
            <p className="text-muted-foreground">
              Belum ada permintaan produksi yang perlu diproses.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedRequests)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, requests]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })}
                  <Badge variant="secondary" className="ml-2">
                    {requests.length} item
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cabang: {request.branchName} • Qty: {request.quantity_requested} unit
                        </p>
                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.notes}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(request.id, 'in_progress')}
                        >
                          Mulai Produksi
                        </Button>
                      )}
                      
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(request.id, 'completed', request.quantity_requested)}
                        >
                          Tandai Selesai
                        </Button>
                      )}
                      
                      {request.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(request.id, 'siap')}
                          >
                            Siap Dikirim
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Diproduksi: {request.quantity_produced || request.quantity_requested} unit
                          </span>
                        </>
                      )}

                      {(request.status === 'completed') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(request.id, 'completed')}
                        >
                          Kirim ke Cabang
                        </Button>
                      )}
                    </div>

                    {request.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2 text-green-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Produk siap untuk dikirim ke cabang
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
}