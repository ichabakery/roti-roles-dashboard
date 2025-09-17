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
        return status;
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string, quantityProduced?: number) => {
    try {
      await updateProductionRequestStatus(requestId, newStatus as any, quantityProduced);
      toast({
        title: 'Status Berhasil Diperbarui',
        description: `Status permintaan produksi telah diubah menjadi ${getStatusLabel(newStatus)}`,
      });
    } catch (error) {
      console.error('Error updating production request status:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui status permintaan produksi',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const filteredRequests = productionRequests.filter(req => {
    const matchesBranch = selectedBranch ? req.branch_id === selectedBranch : true;
    const matchesDate = selectedDate ? req.production_date === selectedDate : true;
    return matchesBranch && matchesDate;
  });

  const groupedRequests = filteredRequests.reduce((acc, req) => {
    const date = req.production_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(req);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Factory className="h-5 w-5" />
            Panel Produksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branch-filter" className="text-sm">Filter Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Cabang</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter" className="text-sm">Filter Tanggal</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Pilih tanggal"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Requests */}
      {Object.keys(groupedRequests).length === 0 ? (
        <Card>
          <CardContent className="p-6 md:p-8 text-center">
            <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-muted-foreground">
              Tidak Ada Permintaan Produksi
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">
              Belum ada permintaan produksi untuk filter yang dipilih
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedRequests).map(([date, requests]) => (
          <Card key={date}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">
                  Produksi {format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: id })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-3 md:p-4 bg-card"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-medium text-sm md:text-base truncate">
                                {request.productName || 'Unknown Product'}
                              </span>
                              <Badge className={`${getStatusColor(request.status)} text-xs self-start`}>
                                {getStatusLabel(request.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground space-y-1 ml-6">
                          <p>Cabang: {request.branchName || 'Unknown Branch'}</p>
                          <p>Jumlah: {request.quantity_requested} unit</p>
                          {request.notes && <p>Catatan: {request.notes}</p>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(request.id, 'in_progress')}
                            className="w-full text-xs md:text-sm"
                          >
                            Mulai Produksi
                          </Button>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(request.id, 'completed')}
                            className="w-full text-xs md:text-sm"
                          >
                            Tandai Selesai
                          </Button>
                        )}
                        
                        {request.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(request.id, 'ready')}
                            className="w-full text-xs md:text-sm"
                          >
                            Siap Dikirim
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}