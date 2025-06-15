
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processReturn } from '@/services/returnService';

interface ReturnApprovalSectionProps {
  returnId: string;
  canApprove: boolean;
  returnStatus: string;
  onReturnProcessed: () => void;
  onClose: () => void;
}

export const ReturnApprovalSection: React.FC<ReturnApprovalSectionProps> = ({
  returnId,
  canApprove,
  returnStatus,
  onReturnProcessed,
  onClose
}) => {
  const [processing, setProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const { toast } = useToast();

  const handleProcess = async (action: 'approve' | 'reject') => {
    try {
      setProcessing(true);
      await processReturn(returnId, action, approvalNotes);
      
      toast({
        title: "Berhasil",
        description: `Retur berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`
      });

      onReturnProcessed();
      onClose();
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

  if (!canApprove || returnStatus !== 'pending') {
    return null;
  }

  return (
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
  );
};
