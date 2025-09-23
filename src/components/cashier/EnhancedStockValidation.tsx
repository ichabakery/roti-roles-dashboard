import React, { useState } from 'react';
import { useInventoryV1Validation } from '@/hooks/useInventoryV1Validation';
import { StockValidationAlert } from '@/components/inventory/StockValidationAlert';
import { CartItem } from '@/types/cashier';
import { isInventoryV1Enabled } from '@/utils/featureFlags';

interface EnhancedStockValidationProps {
  cart: CartItem[];
  branchId: string;
  onValidationComplete: (isValid: boolean) => void;
  children: React.ReactNode;
}

export const EnhancedStockValidation: React.FC<EnhancedStockValidationProps> = ({
  cart,
  branchId,
  onValidationComplete,
  children
}) => {
  const [validationErrors, setValidationErrors] = useState<Array<{
    productId: string;
    productName: string;
    availableStock: number;
    requiredStock: number;
  }>>([]);
  
  const { validateBulkStock, handleNegativeStockOverride, validating } = useInventoryV1Validation();

  const handleValidation = async () => {
    if (!isInventoryV1Enabled() || cart.length === 0) {
      onValidationComplete(true);
      return;
    }

    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const result = await validateBulkStock(items, branchId);

    if (result.isValid) {
      setValidationErrors([]);
      onValidationComplete(true);
    } else {
      // Map invalid items to include product names
      const errors = result.invalidItems.map(invalid => {
        const cartItem = cart.find(item => item.product.id === invalid.productId);
        return {
          productId: invalid.productId,
          productName: cartItem?.product.name || 'Unknown Product',
          availableStock: invalid.availableStock,
          requiredStock: invalid.requiredStock
        };
      });
      
      setValidationErrors(errors);
      onValidationComplete(false);
    }
  };

  const handleOverride = async (reason: string) => {
    const overrideApproved = await handleNegativeStockOverride(reason);
    if (overrideApproved) {
      setValidationErrors([]);
      onValidationComplete(true);
    }
  };

  const handleCancel = () => {
    setValidationErrors([]);
    onValidationComplete(false);
  };

  // Trigger validation when component mounts or cart changes
  React.useEffect(() => {
    if (cart.length > 0) {
      handleValidation();
    }
  }, [cart, branchId]);

  if (validationErrors.length > 0) {
    return (
      <div className="space-y-4">
        {validationErrors.map((error, index) => (
          <StockValidationAlert
            key={`${error.productId}-${index}`}
            productName={error.productName}
            availableStock={error.availableStock}
            requiredStock={error.requiredStock}
            onOverride={handleOverride}
            onCancel={handleCancel}
          />
        ))}
      </div>
    );
  }

  return <>{children}</>;
};