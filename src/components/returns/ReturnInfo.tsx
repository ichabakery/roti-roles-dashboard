
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin } from 'lucide-react';
import { Return } from '@/types/products';
import { format } from 'date-fns';

interface ReturnInfoProps {
  returnItem: Return;
}

export const ReturnInfo: React.FC<ReturnInfoProps> = ({ returnItem }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Menunggu Persetujuan</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <div className="mt-1">
            {getStatusBadge(returnItem.status)}
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Tanggal Retur</Label>
          <div className="mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {format(new Date(returnItem.return_date), 'dd MMMM yyyy, HH:mm')}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Cabang Asal</Label>
          <div className="mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {(returnItem as any).branches?.name || 'Unknown Branch'}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">ID Transaksi</Label>
          <div className="mt-1">
            {returnItem.transaction_id ? (
              <span className="font-mono text-sm">
                {returnItem.transaction_id.substring(0, 8)}...
              </span>
            ) : (
              <span className="text-muted-foreground">Tidak ada</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Alasan Retur</Label>
          <div className="mt-1 p-3 bg-muted rounded-md">
            {returnItem.reason}
          </div>
        </div>

        {returnItem.notes && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Catatan</Label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              {returnItem.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
