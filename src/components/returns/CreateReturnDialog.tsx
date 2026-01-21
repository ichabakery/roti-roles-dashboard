
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';
import { useBranches } from '@/hooks/useBranches';
import { useUserBranch } from '@/hooks/useUserBranch';
import { createReturn } from '@/services/returnService';
import { ReturnFormFields } from './ReturnFormFields';
import { HybridReturnInput } from './HybridReturnInput';
import { ReturnCondition } from '@/types/products';
import { Badge } from '@/components/ui/badge';

interface ReturnItem {
  productId: string;
  quantity: number;
  condition: ReturnCondition;
}

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
  canApprove?: boolean;
}

// Map simplified condition values to ReturnCondition type
const mapConditionToReturnCondition = (condition: string): ReturnCondition => {
  const mapping: Record<string, ReturnCondition> = {
    'resaleable': 'resaleable',
    'damaged': 'damaged',
    'expired': 'expired',
    'wrong_order': 'damaged', // Map to damaged as it's not resaleable
    'customer_return': 'resaleable', // Customer returns can be resold
    'sample': 'sample',
    'bonus': 'bonus',
    'stock_rotation': 'resaleable' // Stock rotation items can be resold
  };
  return mapping[condition] || 'damaged';
};

// Get label for condition
const getConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    'resaleable': 'Bisa Dijual Ulang',
    'damaged': 'Produk Rusak/Cacat',
    'expired': 'Produk Kadaluarsa',
    'wrong_order': 'Salah Pesanan',
    'customer_return': 'Dikembalikan Pelanggan',
    'sample': 'Icipan',
    'bonus': 'Imbohan',
    'stock_rotation': 'Rotasi Stok'
  };
  return labels[condition] || condition;
};

export const CreateReturnDialog: React.FC<CreateReturnDialogProps> = ({
  open,
  onOpenChange,
  userRole,
  canApprove = false
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    condition: 'resaleable',
    notes: '',
    transactionId: ''
  });
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // Read auto-confirm setting
  const autoConfirmEnabled = localStorage.getItem('returnAutoConfirm') === 'true';

  const { toast } = useToast();
  const { products } = useEnhancedProducts();
  const { branches } = useBranches();
  const { userBranch } = useUserBranch();

  // Auto-select branch for kasir_cabang
  useEffect(() => {
    if (userRole === 'kasir_cabang' && userBranch.branchId) {
      setFormData(prev => ({ 
        ...prev, 
        branchId: userBranch.branchId || ''
      }));
    }
  }, [userRole, userBranch.branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.branchId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon pilih cabang"
      });
      return;
    }

    if (!formData.condition) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon pilih alasan retur"
      });
      return;
    }

    const validItems = returnItems.filter(item => item.productId);
    if (validItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon tambahkan minimal 1 produk"
      });
      return;
    }

    setLoading(true);

    try {
      // Determine if we should auto-approve
      const shouldAutoApprove = autoConfirmEnabled && canApprove;
      
      // Map condition to ReturnCondition
      const returnCondition = mapConditionToReturnCondition(formData.condition);

      await createReturn({
        branchId: formData.branchId,
        reason: getConditionLabel(formData.condition),
        notes: formData.notes,
        transactionId: formData.transactionId || undefined,
        autoApprove: shouldAutoApprove,
        items: validItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: getConditionLabel(formData.condition),
          condition: returnCondition
        }))
      });

      toast({
        title: "Berhasil",
        description: shouldAutoApprove 
          ? "Retur berhasil dibuat dan langsung disetujui"
          : "Retur berhasil dibuat dan menunggu persetujuan"
      });

      // Reset form
      setFormData({ 
        branchId: userRole === 'kasir_cabang' ? (userBranch.branchId || '') : '', 
        condition: 'resaleable', 
        notes: '', 
        transactionId: '' 
      });
      setReturnItems([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating return:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal membuat retur: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Get default condition as ReturnCondition
  const defaultCondition = mapConditionToReturnCondition(formData.condition);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-3">
          <div className="flex items-center gap-3">
            <DialogTitle>Buat Retur Baru</DialogTitle>
            {autoConfirmEnabled && canApprove && (
              <Badge variant="secondary" className="text-xs">
                Auto-Approve Aktif
              </Badge>
            )}
          </div>
        </div>
        
        {/* Scrollable Form Content */}
        <form id="create-return-form" onSubmit={handleSubmit} className="space-y-6 px-6 pb-24">
          <ReturnFormFields
            formData={formData}
            setFormData={setFormData}
            branches={branches}
            userRole={userRole}
            userBranchName={userBranch.branchName}
          />

          <HybridReturnInput
            returnItems={returnItems}
            setReturnItems={setReturnItems}
            products={products}
            defaultCondition={defaultCondition}
          />
        </form>

        {/* Sticky Footer with Buttons */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button type="submit" form="create-return-form" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Buat Retur'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
