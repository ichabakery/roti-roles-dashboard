
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bulkDeleteProducts, checkProductRelations, BulkDeleteResult } from '@/services/bulkProductService';
import { Product } from '@/types/products';

interface BulkDeleteProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSuccess: () => void;
}

export const BulkDeleteProductsDialog: React.FC<BulkDeleteProductsDialogProps> = ({
  open,
  onOpenChange,
  products,
  onSuccess
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<BulkDeleteResult | null>(null);
  const [productRelations, setProductRelations] = useState<Record<string, boolean>>({});
  const [checkingRelations, setCheckingRelations] = useState(false);

  const confirmationWord = 'HAPUS';

  // Reset state and check relations when dialog opens
  useEffect(() => {
    if (open) {
      setConfirmInput('');
      setIsProcessing(false);
      setIsCompleted(false);
      setResult(null);
      
      // Check relations for each product
      const checkRelations = async () => {
        setCheckingRelations(true);
        const relations: Record<string, boolean> = {};
        for (const product of products) {
          relations[product.id] = await checkProductRelations(product.id);
        }
        setProductRelations(relations);
        setCheckingRelations(false);
      };
      checkRelations();
    }
  }, [open, products]);

  const isConfirmationValid = confirmInput.toUpperCase() === confirmationWord;
  const canConfirm = isConfirmationValid && !isProcessing && !checkingRelations;

  const productsToDelete = products.filter(p => !productRelations[p.id]);
  const productsToArchive = products.filter(p => productRelations[p.id]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsProcessing(true);
    try {
      const deleteResult = await bulkDeleteProducts(products.map(p => p.id));
      setResult(deleteResult);
      setIsCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      setIsProcessing(false);
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
              <AlertTriangle className="h-6 w-6 text-destructive" />
            )}
            <AlertDialogTitle>
              {isCompleted ? 'Proses Selesai' : 'Hapus Produk Massal'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {isCompleted 
              ? 'Operasi penghapusan produk telah selesai.'
              : `Anda akan menghapus ${products.length} produk. Tindakan ini memerlukan konfirmasi.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isCompleted && (
          <div className="space-y-4 py-4">
            {/* Products preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Produk yang akan diproses ({products.length}):
              </Label>
              <ScrollArea className="h-[160px] rounded-md border">
                <div className="p-2 space-y-1">
                  {checkingRelations ? (
                    <div className="flex items-center justify-center py-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Memeriksa relasi data...
                    </div>
                  ) : (
                    products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between text-sm py-1.5 px-2 hover:bg-muted rounded">
                        <span className="font-medium truncate">{product.name}</span>
                        <Badge variant={productRelations[product.id] ? 'secondary' : 'destructive'} className="shrink-0 ml-2">
                          {productRelations[product.id] ? (
                            <><Archive className="h-3 w-3 mr-1" /> Arsip</>
                          ) : (
                            <><Trash2 className="h-3 w-3 mr-1" /> Hapus</>
                          )}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Summary */}
            {!checkingRelations && (
              <div className="flex gap-2 flex-wrap">
                {productsToDelete.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <Trash2 className="h-3 w-3" />
                    {productsToDelete.length} akan dihapus permanen
                  </Badge>
                )}
                {productsToArchive.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Archive className="h-3 w-3" />
                    {productsToArchive.length} akan diarsipkan
                  </Badge>
                )}
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <div className="text-sm text-orange-700 dark:text-orange-400">
                <p className="font-medium">Perhatian:</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Produk dengan transaksi/stok akan diarsipkan (bisa dipulihkan)</li>
                  <li>Produk tanpa relasi data akan dihapus permanen</li>
                </ul>
              </div>
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
                <p><strong>{result.deleted.length}</strong> produk dihapus permanen</p>
                <p><strong>{result.archived.length}</strong> produk diarsipkan</p>
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
                  'Konfirmasi Hapus'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
