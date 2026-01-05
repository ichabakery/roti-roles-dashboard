
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
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmBulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmationWord: string;
  confirmationLabel?: string;
  items: Array<{ id: string; label: string; sublabel?: string }>;
  onConfirm: (reason?: string) => Promise<void>;
  variant?: 'danger' | 'warning' | 'info';
  showReasonInput?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  warningMessage?: string;
  successMessage?: string;
}

export const ConfirmBulkActionDialog: React.FC<ConfirmBulkActionDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmationWord,
  confirmationLabel,
  items,
  onConfirm,
  variant = 'danger',
  showReasonInput = false,
  reasonLabel = 'Alasan',
  reasonPlaceholder = 'Masukkan alasan...',
  reasonRequired = false,
  warningMessage,
  successMessage
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmInput('');
      setReason('');
      setIsProcessing(false);
      setIsCompleted(false);
    }
  }, [open]);

  const isConfirmationValid = confirmInput.toUpperCase() === confirmationWord.toUpperCase();
  const isReasonValid = !reasonRequired || reason.trim().length > 0;
  const canConfirm = isConfirmationValid && isReasonValid && !isProcessing;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    
    setIsProcessing(true);
    try {
      await onConfirm(reason);
      setIsCompleted(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error('Bulk action failed:', error);
      setIsProcessing(false);
    }
  };

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
      buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      buttonClass: 'bg-orange-500 text-white hover:bg-orange-600'
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
      buttonClass: 'bg-blue-500 text-white hover:bg-blue-600'
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
              variantStyles[variant].icon
            )}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!isCompleted && (
          <div className="space-y-4 py-4">
            {/* Items list */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {items.length} item yang akan diproses:
              </Label>
              <ScrollArea className="h-[120px] rounded-md border p-2">
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="text-sm py-1 px-2 hover:bg-muted rounded">
                      <span className="font-medium">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-muted-foreground ml-2">({item.sublabel})</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Warning message */}
            {warningMessage && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <p className="text-sm text-orange-700 dark:text-orange-400">{warningMessage}</p>
              </div>
            )}

            {/* Reason input */}
            {showReasonInput && (
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  {reasonLabel} {reasonRequired && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                  className="min-h-[80px]"
                />
              </div>
            )}

            {/* Confirmation input */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                {confirmationLabel || `Ketik "${confirmationWord}" untuk konfirmasi:`}
              </Label>
              <Input
                id="confirmation"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={confirmationWord}
                className={cn(
                  isConfirmationValid && "border-green-500 focus-visible:ring-green-500"
                )}
                autoComplete="off"
              />
              {confirmInput && !isConfirmationValid && (
                <p className="text-xs text-muted-foreground">
                  Harus sama persis dengan "{confirmationWord}"
                </p>
              )}
            </div>
          </div>
        )}

        {isCompleted && successMessage && (
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
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
                className={variantStyles[variant].buttonClass}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  'Konfirmasi'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
