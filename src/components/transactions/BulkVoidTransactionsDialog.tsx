
import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Loader2, XCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bulkVoidTransactions, BulkVoidResult, TransactionVoidItem, getTransactionsByIds } from '@/services/bulkTransactionService';

interface BulkVoidTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionIds: string[];
  userId: string;
  onSuccess: () => void;
}

export const BulkVoidTransactionsDialog: React.FC<BulkVoidTransactionsDialogProps> = ({
  open,
  onOpenChange,
  transactionIds,
  userId,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<BulkVoidResult | null>(null);
  const [transactions, setTransactions] = useState<TransactionVoidItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const confirmationWord = 'VOID';

  // Load transactions when dialog opens
  useEffect(() => {
    if (open && transactionIds.length > 0) {
      setConfirmInput('');
      setIsProcessing(false);
      setIsCompleted(false);
      setResult(null);
      setReason('');
      
      const loadItems = async () => {
        setLoadingItems(true);
        try {
          const items = await getTransactionsByIds(transactionIds);
          setTransactions(items);
        } catch (error) {
          console.error('Failed to load transactions:', error);
        } finally {
          setLoadingItems(false);
        }
      };
      loadItems();
    }
  }, [open, transactionIds]);

  const isConfirmationValid = confirmInput.toUpperCase() === confirmationWord;
  const isReasonValid = reason.trim().length > 0;
  const canConfirm = isConfirmationValid && isReasonValid && !isProcessing && !loadingItems;

  // Filter out already cancelled transactions
  const validTransactions = transactions.filter(tx => tx.status !== 'cancelled');
  const cancelledTransactions = transactions.filter(tx => tx.status === 'cancelled');

  const totalAmount = validTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsProcessing(true);
    try {
      const voidResult = await bulkVoidTransactions(
        validTransactions.map(tx => tx.id),
        reason,
        userId
      );
      setResult(voidResult);
      setIsCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Bulk void transactions failed:', error);
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            <AlertDialogTitle>
              {isCompleted ? 'Proses Selesai' : 'Void Transaksi Massal'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {isCompleted 
              ? 'Transaksi berhasil di-void dan stok dikembalikan.'
              : `Anda akan membatalkan ${validTransactions.length} transaksi.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isCompleted && (
          <div className="space-y-4 py-4">
            {/* Transactions preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Transaksi yang akan di-void ({validTransactions.length}):
              </Label>
              <ScrollArea className="h-[140px] rounded-md border">
                <div className="p-2 space-y-1">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Memuat data...
                    </div>
                  ) : (
                    <>
                      {validTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-sm py-1.5 px-2 hover:bg-muted rounded">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{formatDate(tx.transaction_date)}</div>
                            <div className="text-xs text-muted-foreground">{tx.branch_name}</div>
                          </div>
                          <span className="font-medium shrink-0 ml-2">
                            Rp {tx.total_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                      {cancelledTransactions.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            Sudah dibatalkan sebelumnya ({cancelledTransactions.length}):
                          </p>
                          {cancelledTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between text-xs py-1 px-2 text-muted-foreground">
                              <span>{formatDate(tx.transaction_date)}</span>
                              <Badge variant="outline" className="text-xs">Cancelled</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Summary */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total Nilai Transaksi:</span>
                <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <Package className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div className="text-sm text-orange-700 dark:text-orange-400">
                <p className="font-medium">Stok akan dikembalikan!</p>
                <p className="text-xs mt-1">Semua item dalam transaksi ini akan dikembalikan ke inventory cabang masing-masing.</p>
              </div>
            </div>

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Alasan Pembatalan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Kesalahan input, permintaan pelanggan, transaksi duplikat..."
                className="min-h-[60px]"
              />
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Ketik "{confirmationWord}" untuk konfirmasi:
              </Label>
              <Input
                id="confirmation"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                placeholder={confirmationWord}
                className={cn(
                  isConfirmationValid && "border-green-500 focus-visible:ring-green-500"
                )}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {isCompleted && result && (
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <div className="text-sm text-green-700 dark:text-green-400">
                <p><strong>{result.voided.length}</strong> transaksi berhasil di-void</p>
                <p><strong>{result.stockReturned}</strong> unit stok dikembalikan ke inventory</p>
                {result.failed.length > 0 && (
                  <p className="text-orange-600"><strong>{result.failed.length}</strong> gagal diproses</p>
                )}
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {!isCompleted && (
            <>
              <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  'Void Transaksi'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
