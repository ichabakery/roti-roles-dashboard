import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResetDataDialogProps {
  type: 'inventory' | 'transactions';
  onSuccess: () => void;
}

export const ResetDataDialog: React.FC<ResetDataDialogProps> = ({ type, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isInventory = type === 'inventory';
  const title = isInventory ? 'Reset Semua Stok' : 'Reset Semua Transaksi';
  const description = isInventory 
    ? 'Tindakan ini akan menghapus SEMUA data stok inventori di semua cabang. Data yang dihapus tidak dapat dikembalikan.'
    : 'Tindakan ini akan menghapus SEMUA data transaksi, item transaksi, dan riwayat pembayaran. Data yang dihapus tidak dapat dikembalikan.';
  const confirmWord = isInventory ? 'RESET STOK' : 'RESET TRANSAKSI';

  const handleReset = async () => {
    if (confirmText !== confirmWord) {
      toast({
        variant: "destructive",
        title: "Konfirmasi tidak valid",
        description: `Ketik "${confirmWord}" untuk mengonfirmasi`,
      });
      return;
    }

    setLoading(true);
    try {
      if (isInventory) {
        // Reset inventory - delete all records
        const { error: invError } = await supabase
          .from('inventory')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (invError) throw invError;

        // Also reset stock_movements related to inventory
        const { error: movError } = await supabase
          .from('stock_movements')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (movError) console.warn('Stock movements reset warning:', movError);

        // Reset stock_adjustments
        const { error: adjError } = await supabase
          .from('stock_adjustments')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (adjError) console.warn('Stock adjustments reset warning:', adjError);

        toast({
          title: "Berhasil",
          description: "Semua data stok inventori telah direset",
        });
      } else {
        // Reset transactions - delete in correct order due to foreign keys
        // 1. Delete payment_history first
        const { error: paymentError } = await supabase
          .from('payment_history')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (paymentError) console.warn('Payment history reset warning:', paymentError);

        // 2. Delete transaction_items
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (itemsError) throw itemsError;

        // 3. Delete transactions
        const { error: transError } = await supabase
          .from('transactions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (transError) throw transError;

        toast({
          title: "Berhasil",
          description: "Semua data transaksi telah direset",
        });
      }

      setOpen(false);
      setConfirmText('');
      onSuccess();
    } catch (error: any) {
      console.error('Reset error:', error);
      toast({
        variant: "destructive",
        title: "Gagal mereset data",
        description: error.message || "Terjadi kesalahan saat mereset data",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {title}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-destructive font-medium">
              ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!
            </p>
            <p>{description}</p>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Ketik <strong className="text-foreground">{confirmWord}</strong> untuk mengonfirmasi:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={confirmWord}
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={confirmText !== confirmWord || loading}
          >
            {loading ? 'Mereset...' : 'Ya, Reset Sekarang'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
