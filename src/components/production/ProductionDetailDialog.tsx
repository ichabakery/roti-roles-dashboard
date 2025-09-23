
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductionRequest } from '@/hooks/useProduction';
import { format, parseISO } from 'date-fns';

interface ProductionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ProductionRequest | null;
  onCompleteRequest?: (id: string, quantityProduced: number) => void;
  onCancelRequest?: (id: string) => void;
  onStartRequest?: (id: string) => void;
  userRole: string;
}

const ProductionDetailDialog: React.FC<ProductionDetailDialogProps> = ({
  open,
  onOpenChange,
  request,
  onCompleteRequest,
  onCancelRequest,
  onStartRequest,
  userRole
}) => {
  const [quantityProduced, setQuantityProduced] = useState<number>(request?.quantity_requested || 0);
  
  // Update quantity when request changes
  React.useEffect(() => {
    if (request) {
      setQuantityProduced(request.quantity_produced || request.quantity_requested);
    }
  }, [request]);
  
  if (!request) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Sedang Diproses</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canManageProduction = userRole === 'owner' || userRole === 'kepala_produksi';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detail Permintaan Produksi</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang permintaan produksi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{request.productName}</h3>
              <p className="text-sm text-muted-foreground">ID: {request.id.substring(0, 8)}...</p>
            </div>
            <div>{getStatusBadge(request.status)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Cabang</p>
              <p>{request.branchName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Jumlah</p>
              <p>{request.quantity_requested} unit</p>
            </div>
            <div>
              <p className="text-sm font-medium">Tanggal Produksi</p>
              <p>{formatDate(request.production_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Dibuat Pada</p>
              <p>{formatDate(request.created_at)}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <p className="text-sm font-medium">Catatan</p>
              <p className="text-sm mt-1 p-2 bg-muted rounded-md">{request.notes}</p>
            </div>
          )}

          {request.status === 'completed' && request.quantity_produced && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm font-medium text-green-800">Hasil Produksi</p>
              <p className="text-sm text-green-700">{request.quantity_produced} unit berhasil diproduksi</p>
            </div>
          )}
          
          {/* Quantity Produced Input for In Progress Requests */}
          {request.status === 'in_progress' && canManageProduction && (
            <div className="bg-blue-50 p-3 rounded-md">
              <Label htmlFor="quantityProduced" className="text-sm font-medium text-blue-800">
                Jumlah yang Diproduksi
              </Label>
              <Input
                id="quantityProduced"
                type="number"
                value={quantityProduced || request.quantity_requested}
                onChange={(e) => setQuantityProduced(Number(e.target.value))}
                min={1}
                max={request.quantity_requested}
                className="mt-1"
                placeholder="Masukkan jumlah yang diproduksi"
              />
              <p className="text-xs text-blue-600 mt-1">
                Target: {request.quantity_requested} unit
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          
          {canManageProduction && (
            <div className="flex gap-2">
              {request.status === 'pending' && onStartRequest && (
                <Button onClick={() => onStartRequest(request.id)}>
                  Mulai Produksi
                </Button>
              )}
              
              {request.status === 'in_progress' && onCompleteRequest && (
                <Button onClick={() => onCompleteRequest(request.id, quantityProduced || request.quantity_requested)}>
                  Selesaikan
                </Button>
              )}
              
              {(request.status === 'pending' || request.status === 'in_progress') && onCancelRequest && (
                <Button variant="destructive" onClick={() => onCancelRequest(request.id)}>
                  Batalkan
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionDetailDialog;
