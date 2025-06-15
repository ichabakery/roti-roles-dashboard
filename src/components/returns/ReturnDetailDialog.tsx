
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Package, Calendar, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Return, ReturnItem } from '@/types/products';
import { fetchReturnItems, processReturn } from '@/services/returnService';
import { format } from 'date-fns';

interface ReturnDetailDialogProps {
  returnItem: Return | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canApprove: boolean;
  onReturnProcessed: () => void;
}

export const ReturnDetailDialog: React.FC<ReturnDetailDialogProps> = ({
  returnItem,
  open,
  onOpenChange,
  canApprove,
  onReturnProcessed
}) => {
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (returnItem && open) {
      loadReturnItems();
    }
  }, [returnItem, open]);

  const loadReturnItems = async () => {
    if (!returnItem) return;
    
    try {
      setLoading(true);
      const items = await fetchReturnItems(returnItem.id);
      setReturnItems(items);
    } catch (error) {
      console.error('Error loading return items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat detail item retur"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!returnItem) return;

    try {
      setProcessing(true);
      await processReturn(returnItem.id, action, approvalNotes);
      
      toast({
        title: "Berhasil",
        description: `Retur berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`
      });

      onReturnProcessed();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing return:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memproses retur: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

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

  if (!returnItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detail Retur #{returnItem.id.substring(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status & Basic Info */}
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

          <Separator />

          {/* Return Items */}
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

          {/* Approval Section */}
          {canApprove && returnItem.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Persetujuan Retur</Label>
                
                <div>
                  <Label htmlFor="approvalNotes">Catatan Persetujuan (Opsional)</Label>
                  <Textarea
                    id="approvalNotes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Tambahkan catatan untuk keputusan persetujuan..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleProcess('approve')}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Memproses...' : 'Setujui Retur'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => handleProcess('reject')}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Memproses...' : 'Tolak Retur'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
