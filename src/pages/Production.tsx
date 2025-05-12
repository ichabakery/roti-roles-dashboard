
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Coffee } from 'lucide-react';

const Production = () => {
  // Data dummy untuk permintaan produksi
  const productionRequests = [
    { 
      id: 'PR001', 
      branchName: 'Cabang Utama', 
      items: [
        { name: 'Roti Tawar', quantity: 50 },
        { name: 'Donat', quantity: 30 },
      ],
      status: 'pending',
      requestDate: '2023-11-15 08:35',
      priority: 'high'
    },
    { 
      id: 'PR002', 
      branchName: 'Cabang Timur', 
      items: [
        { name: 'Croissant', quantity: 40 },
        { name: 'Danish', quantity: 25 },
      ],
      status: 'in_progress',
      requestDate: '2023-11-15 09:45',
      priority: 'medium'
    },
    { 
      id: 'PR003', 
      branchName: 'Cabang Barat', 
      items: [
        { name: 'Bakpau', quantity: 60 },
        { name: 'Roti Manis', quantity: 45 },
      ],
      status: 'completed',
      requestDate: '2023-11-14 14:20',
      priority: 'low'
    },
  ];
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diproses</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge className="bg-red-500">Tinggi</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Sedang</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Rendah</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productionRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {request.id}
                </CardTitle>
                {getStatusBadge(request.status)}
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Cabang</span>
                    <span className="text-sm text-muted-foreground">{request.branchName}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Tanggal Permintaan</span>
                    <span className="text-sm text-muted-foreground">{request.requestDate}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Prioritas</span>
                    <span>{getPriorityBadge(request.priority)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Item yang Diminta:</h4>
                  <ul className="text-sm space-y-1">
                    {request.items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.quantity} pcs</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4">
                  {request.status === 'pending' && (
                    <Button className="w-full">
                      <Coffee className="mr-2 h-4 w-4" />
                      Mulai Produksi
                    </Button>
                  )}
                  
                  {request.status === 'in_progress' && (
                    <Button className="w-full" variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesai Produksi
                    </Button>
                  )}
                  
                  {request.status === 'completed' && (
                    <Button className="w-full" variant="outline" disabled>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selesai
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Production;
