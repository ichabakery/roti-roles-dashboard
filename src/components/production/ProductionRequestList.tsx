
import React from 'react';
import { 
  Table, TableHeader, TableHead, TableRow, 
  TableBody, TableCell, TableFooter 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';
import { Check, Clock, MoreVertical, Play, X } from 'lucide-react';
import { ProductionRequest } from '@/hooks/useProduction';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductionRequestListProps {
  requests: ProductionRequest[];
  loading: boolean;
  onStatusChange: (id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled', quantity?: number) => void;
  onDelete: (id: string) => void;
  onViewDetails: (request: ProductionRequest) => void;
  userRole: string;
}

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
};

const ProductionRequestList: React.FC<ProductionRequestListProps> = ({
  requests,
  loading,
  onStatusChange,
  onDelete,
  onViewDetails,
  userRole
}) => {
  const isMobile = useIsMobile();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="default">Sedang Diproses</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Belum ada permintaan produksi</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Permintaan produksi akan muncul di sini
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="w-full cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails(request)}>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-medium leading-tight pr-2">
                  {request.productName || 'Produk tidak diketahui'}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(request);
                    }}>
                      Lihat Detail
                    </DropdownMenuItem>

                    {userRole === 'kepala_produksi' || userRole === 'owner' ? (
                      <>
                        {request.status === 'pending' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'in_progress');
                          }}>
                            <Play className="mr-2 h-4 w-4" />
                            Mulai Produksi
                          </DropdownMenuItem>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'completed', request.quantity_requested);
                          }}>
                            <Check className="mr-2 h-4 w-4" />
                            Selesaikan Produksi
                          </DropdownMenuItem>
                        )}
                        
                        {(request.status === 'pending' || request.status === 'in_progress') && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'cancelled');
                          }} className="text-destructive">
                            <X className="mr-2 h-4 w-4" />
                            Batalkan
                          </DropdownMenuItem>
                        )}

                        {userRole === 'owner' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onDelete(request.id);
                          }} className="text-destructive">
                            Hapus
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cabang:</span>
                  <span className="text-right truncate ml-2">{request.branchName || 'Cabang tidak diketahui'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="text-right">{request.quantity_requested}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="text-right">{formatDate(request.production_date)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex-shrink-0">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Tanggal Produksi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails(request)}>
              <TableCell className="font-medium">{request.productName || 'Produk tidak diketahui'}</TableCell>
              <TableCell>{request.branchName || 'Cabang tidak diketahui'}</TableCell>
              <TableCell>{request.quantity_requested}</TableCell>
              <TableCell>{formatDate(request.production_date)}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(request);
                    }}>
                      Lihat Detail
                    </DropdownMenuItem>

                    {userRole === 'kepala_produksi' || userRole === 'owner' ? (
                      <>
                        {request.status === 'pending' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'in_progress');
                          }}>
                            <Play className="mr-2 h-4 w-4" />
                            Mulai Produksi
                          </DropdownMenuItem>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'completed', request.quantity_requested);
                          }}>
                            <Check className="mr-2 h-4 w-4" />
                            Selesaikan Produksi
                          </DropdownMenuItem>
                        )}
                        
                        {(request.status === 'pending' || request.status === 'in_progress') && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(request.id, 'cancelled');
                          }} className="text-destructive">
                            <X className="mr-2 h-4 w-4" />
                            Batalkan
                          </DropdownMenuItem>
                        )}

                        {userRole === 'owner' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onDelete(request.id);
                          }} className="text-destructive">
                            Hapus
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductionRequestList;
