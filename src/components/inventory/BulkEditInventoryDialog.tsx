
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Minus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bulkEditInventory, InventoryOperation, BulkEditInventoryResult, InventoryEditItem, getInventoryByIds } from '@/services/bulkInventoryService';

interface BulkEditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryIds: string[];
  userId: string;
  onSuccess: () => void;
}

export const BulkEditInventoryDialog: React.FC<BulkEditInventoryDialogProps> = ({
  open,
  onOpenChange,
  inventoryIds,
  userId,
  onSuccess
}) => {
  const [operation, setOperation] = useState<InventoryOperation>('set');
  const [value, setValue] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<BulkEditInventoryResult | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryEditItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const confirmationWord = 'UBAH';

  // Load inventory items when dialog opens
  useEffect(() => {
    if (open && inventoryIds.length > 0) {
      setConfirmInput('');
      setIsProcessing(false);
      setIsCompleted(false);
      setResult(null);
      setOperation('set');
      setValue(0);
      setReason('');
      
      const loadItems = async () => {
        setLoadingItems(true);
        try {
          const items = await getInventoryByIds(inventoryIds);
          setInventoryItems(items);
        } catch (error) {
          console.error('Failed to load inventory items:', error);
        } finally {
          setLoadingItems(false);
        }
      };
      loadItems();
    }
  }, [open, inventoryIds]);

  const isConfirmationValid = confirmInput.toUpperCase() === confirmationWord;
  const isReasonValid = reason.trim().length > 0;
  const canConfirm = isConfirmationValid && isReasonValid && !isProcessing && !loadingItems;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsProcessing(true);
    try {
      const editResult = await bulkEditInventory(
        inventoryIds,
        operation,
        value,
        userId,
        reason
      );
      setResult(editResult);
      setIsCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Bulk edit inventory failed:', error);
      setIsProcessing(false);
    }
  };

  const getOperationPreview = (currentQty: number): number => {
    switch (operation) {
      case 'set': return value;
      case 'add': return currentQty + value;
      case 'subtract': return Math.max(0, currentQty - value);
      case 'reset': return 0;
      default: return currentQty;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            )}
            <AlertDialogTitle>
              {isCompleted ? 'Proses Selesai' : 'Edit Quantity Inventori Massal'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {isCompleted 
              ? 'Perubahan quantity inventori telah selesai.'
              : `Anda akan mengubah quantity ${inventoryIds.length} item inventori.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isCompleted && (
          <div className="space-y-4 py-4">
            {/* Operation selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pilih Operasi:</Label>
              <RadioGroup value={operation} onValueChange={(v) => setOperation(v as InventoryOperation)}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="set" id="set" />
                    <Label htmlFor="set" className="cursor-pointer flex items-center gap-2">
                      <span className="text-lg">=</span> Set Nilai
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="cursor-pointer flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Tambah
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="subtract" id="subtract" />
                    <Label htmlFor="subtract" className="cursor-pointer flex items-center gap-2">
                      <Minus className="h-4 w-4" /> Kurangi
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="reset" id="reset" />
                    <Label htmlFor="reset" className="cursor-pointer flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" /> Reset ke 0
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Value input (hidden for reset) */}
            {operation !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="value" className="text-sm font-medium">
                  {operation === 'set' ? 'Nilai Baru:' : operation === 'add' ? 'Tambah:' : 'Kurangi:'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                  placeholder="Masukkan angka..."
                />
              </div>
            )}

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview Perubahan:</Label>
              <ScrollArea className="h-[120px] rounded-md border">
                <div className="p-2 space-y-1">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Memuat data...
                    </div>
                  ) : (
                    inventoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm py-1.5 px-2 hover:bg-muted rounded">
                        <span className="font-medium truncate">{item.product_name}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-muted-foreground">{item.quantity}</span>
                          <span>→</span>
                          <span className={cn(
                            "font-medium",
                            getOperationPreview(item.quantity) !== item.quantity && "text-primary"
                          )}>
                            {getOperationPreview(item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Alasan Perubahan <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Koreksi stock opname, penyesuaian data..."
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
                <p><strong>{result.updated.length}</strong> item berhasil diperbarui</p>
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi Perubahan'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
