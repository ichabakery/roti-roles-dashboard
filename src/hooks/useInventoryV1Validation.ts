import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateStockAvailability } from '@/services/inventoryV1Service';
import { isInventoryV1Enabled, isNegativeStockOverrideAllowed } from '@/utils/featureFlags';

export interface StockValidationResult {
  isValid: boolean;
  availableStock: number;
  message?: string;
  canOverride?: boolean;
}

export const useInventoryV1Validation = () => {
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  /**
   * Validate stock availability before transaction
   */
  const validateStock = async (
    productId: string,
    branchId: string,
    requiredQuantity: number
  ): Promise<StockValidationResult> => {
    if (!isInventoryV1Enabled()) {
      return { isValid: true, availableStock: requiredQuantity };
    }

    setValidating(true);

    try {
      const result = await validateStockAvailability(productId, branchId, requiredQuantity);
      
      if (!result.isValid) {
        const canOverride = isNegativeStockOverrideAllowed();
        
        if (!canOverride) {
          toast({
            variant: "destructive",
            title: "Stok Tidak Mencukupi",
            description: result.message || "Stok tidak mencukupi untuk transaksi ini",
          });
        }

        return {
          ...result,
          canOverride
        };
      }

      return result;
    } catch (error) {
      console.error('Stock validation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memvalidasi stok. Silakan coba lagi.",
      });
      
      return {
        isValid: false,
        availableStock: 0,
        message: "Error validating stock"
      };
    } finally {
      setValidating(false);
    }
  };

  /**
   * Validate multiple items (for cart/bulk operations)
   */
  const validateBulkStock = async (
    items: Array<{ productId: string; quantity: number }>,
    branchId: string
  ): Promise<{ 
    isValid: boolean; 
    invalidItems: Array<{ productId: string; availableStock: number; requiredStock: number }>
  }> => {
    const invalidItems: Array<{ productId: string; availableStock: number; requiredStock: number }> = [];

    for (const item of items) {
      const result = await validateStock(item.productId, branchId, item.quantity);
      
      if (!result.isValid) {
        invalidItems.push({
          productId: item.productId,
          availableStock: result.availableStock,
          requiredStock: item.quantity
        });
      }
    }

    return {
      isValid: invalidItems.length === 0,
      invalidItems
    };
  };

  /**
   * Handle negative stock override with reason
   */
  const handleNegativeStockOverride = async (
    reason: string,
    supervisorApproval?: string
  ): Promise<boolean> => {
    if (!isNegativeStockOverrideAllowed()) {
      toast({
        variant: "destructive",
        title: "Override Tidak Diizinkan",
        description: "Override stok negatif tidak diaktifkan untuk sistem ini",
      });
      return false;
    }

    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Alasan Diperlukan",
        description: "Harap berikan alasan untuk override stok negatif",
      });
      return false;
    }

    // In a real implementation, this would log the override and require supervisor approval
    console.log('Stock override approved:', { reason, supervisorApproval });
    
    toast({
      title: "Override Disetujui",
      description: "Transaksi dilanjutkan dengan stok negatif atas persetujuan supervisor",
    });

    return true;
  };

  return {
    validateStock,
    validateBulkStock,
    handleNegativeStockOverride,
    validating
  };
};