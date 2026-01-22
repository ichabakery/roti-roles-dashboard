
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Plus, Minus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bulkEditInventory, InventoryOperation, BulkEditInventoryResult, InventoryEditItem, getInventoryByIds } from '@/services/bulkInventoryService';

interface BulkEditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryIds: string[];
  userId: string;
  onSuccess: () => void;
}

const reasonPresets = [
  { value: 'stock_opname', label: 'Stock Opname' },
  { value: 'production', label: 'Hasil Produksi' },
  { value: 'correction', label: 'Koreksi Data' },
  { value: 'transfer', label: 'Transfer Antar Cabang' },
  { value: 'expired', label: 'Produk Expired' },
  { value: 'damaged', label: 'Produk Rusak' },
  { value: 'other', label: 'Lainnya' }
];

export const BulkEditInventoryDialog: React.FC<BulkEditInventoryDialogProps> = ({
  open,
  onOpenChange,
  inventoryIds,
  userId,
  onSuccess
}) => {
  const [operation, setOperation] = useState<InventoryOperation>('set');
  const [value, setValue] = useState<number>(0);
  const [reason, setReason] = useState('stock_opname');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<BulkEditInventoryResult | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryEditItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load inventory items when dialog opens
  useEffect(() => {
    if (open && inventoryIds.length > 0) {
      setIsProcessing(false);
      setIsCompleted(false);
      setResult(null);
      setOperation('set');
      setValue(0);
      setReason('stock_opname');
      
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

  const canConfirm = !isProcessing && !loadingItems && reason;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    const reasonLabel = reasonPresets.find(r => r.value === reason)?.label || reason;
    
    setIsProcessing(true);
    try {
      const editResult = await bulkEditInventory(
        inventoryIds,
        operation,
        value,
        userId,
        reasonLabel
      );
      setResult(editResult);
      setIsCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{inventoryIds.length}</span>
                </div>
              )}
              <DialogTitle>
                {isCompleted ? 'Selesai!' : 'Edit Stok'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left">
              {isCompleted 
                ? 'Perubahan stok berhasil disimpan.'
                : `Ubah ${inventoryIds.length} item sekaligus`
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          {!isCompleted && (
            <div className="space-y-4 py-4">
              {/* Operation selection - compact */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Operasi:</Label>
                <RadioGroup 
                  value={operation} 
                  onValueChange={(v) => setOperation(v as InventoryOperation)}
                  className="grid grid-cols-4 gap-2"
                >
                  <div className={cn(
                    "flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors",
                    operation === 'set' && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="set" id="set" className="sr-only" />
                    <Label htmlFor="set" className="cursor-pointer text-center">
                      <span className="text-lg font-bold">=</span>
                      <span className="block text-xs mt-1">Set</span>
                    </Label>
                  </div>
                  <div className={cn(
                    "flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors",
                    operation === 'add' && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="add" id="add" className="sr-only" />
                    <Label htmlFor="add" className="cursor-pointer text-center">
                      <Plus className="h-5 w-5 mx-auto" />
                      <span className="block text-xs mt-1">Tambah</span>
                    </Label>
                  </div>
                  <div className={cn(
                    "flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors",
                    operation === 'subtract' && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="subtract" id="subtract" className="sr-only" />
                    <Label htmlFor="subtract" className="cursor-pointer text-center">
                      <Minus className="h-5 w-5 mx-auto" />
                      <span className="block text-xs mt-1">Kurangi</span>
                    </Label>
                  </div>
                  <div className={cn(
                    "flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors",
                    operation === 'reset' && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value="reset" id="reset" className="sr-only" />
                    <Label htmlFor="reset" className="cursor-pointer text-center">
                      <RotateCcw className="h-5 w-5 mx-auto" />
                      <span className="block text-xs mt-1">Reset</span>
                    </Label>
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
                    placeholder="0"
                    className="text-lg font-medium"
                  />
                </div>
              )}

              {/* Reason dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Alasan:</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compact Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Preview:</Label>
                <ScrollArea className="h-[100px] rounded-md border bg-muted/30">
                  <div className="p-2 space-y-1">
                    {loadingItems ? (
                      <div className="flex items-center justify-center py-4 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Memuat...
                      </div>
                    ) : (
                      inventoryItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm py-1 px-2">
                          <span className="truncate text-muted-foreground">{item.product_name}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2 font-mono text-xs">
                            <span className="text-muted-foreground">{item.quantity}</span>
                            <span className="text-muted-foreground">→</span>
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
            </div>
          )}

          {isCompleted && result && (
            <div className="py-6">
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  <strong>{result.updated.length}</strong> item berhasil diperbarui
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCompleted && (
          <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
