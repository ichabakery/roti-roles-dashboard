
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';
import { Return, ReturnItem } from '@/types/products';
import { fetchReturnItems } from '@/services/returnService';
import { useToast } from '@/hooks/use-toast';
import { ReturnInfo } from './ReturnInfo';
import { ReturnItemsList } from './ReturnItemsList';
import { ReturnApprovalSection } from './ReturnApprovalSection';

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
          {/* Return Information */}
          <ReturnInfo returnItem={returnItem} />

          <Separator />

          {/* Return Items */}
          <ReturnItemsList returnItems={returnItems} loading={loading} />

          {/* Approval Section */}
          <ReturnApprovalSection
            returnId={returnItem.id}
            canApprove={canApprove}
            returnStatus={returnItem.status}
            onReturnProcessed={onReturnProcessed}
            onClose={() => onOpenChange(false)}
          />

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
