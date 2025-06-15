
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';
import { ReturnItem } from '@/types/products';

interface ReturnItemsListProps {
  returnItems: ReturnItem[];
  loading: boolean;
}

export const ReturnItemsList: React.FC<ReturnItemsListProps> = ({ returnItems, loading }) => {
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'resaleable':
        return <Badge variant="default" className="bg-green-500">Bisa Dijual Ulang</Badge>;
      case 'damaged':
        return <Badge variant="destructive">Rusak</Badge>;
      case 'expired':
        return <Badge variant="secondary">Kadaluarsa</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  return (
    <div>
      <Label className="text-base font-semibold flex items-center gap-2 mb-4">
        <Package className="h-5 w-5" />
        Produk yang Diretur
      </Label>

      {loading ? (
        <div className="text-center py-8">Memuat item retur...</div>
      ) : (
        <div className="space-y-3">
          {returnItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Produk</Label>
                  <div className="mt-1 font-medium">
                    {item.product?.name || 'Unknown Product'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Jumlah</Label>
                  <div className="mt-1 font-medium">
                    {item.quantity} unit
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Kondisi</Label>
                  <div className="mt-1">
                    {getConditionBadge(item.condition)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Alasan</Label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.reason || 'Tidak ada detail'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
