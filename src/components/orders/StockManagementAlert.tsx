import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Factory, ShoppingCart } from 'lucide-react';

interface StockManagementAlertProps {
  productName: string;
  requestedQuantity: number;
  availableStock: number;
  onCreateProductionRequest?: () => void;
  onPartialOrder?: () => void;
}

export const StockManagementAlert: React.FC<StockManagementAlertProps> = ({
  productName,
  requestedQuantity,
  availableStock,
  onCreateProductionRequest,
  onPartialOrder
}) => {
  const shortage = requestedQuantity - availableStock;

  if (availableStock === 0) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p>
              <strong>{productName}</strong> tidak tersedia di cabang ini. 
              Stok diminta: <strong>{requestedQuantity}</strong>, tersedia: <strong>0</strong>
            </p>
            <div className="flex gap-2">
              {onCreateProductionRequest && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCreateProductionRequest}
                  className="flex items-center gap-2"
                >
                  <Factory className="h-4 w-4" />
                  Buat Permintaan Produksi
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (shortage > 0) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p>
              Stok <strong>{productName}</strong> tidak mencukupi. 
              Diminta: <strong>{requestedQuantity}</strong>, tersedia: <strong>{availableStock}</strong>, 
              kurang: <strong>{shortage}</strong>
            </p>
            <div className="flex gap-2">
              {onPartialOrder && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onPartialOrder}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Pesan {availableStock} unit saja
                </Button>
              )}
              {onCreateProductionRequest && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCreateProductionRequest}
                  className="flex items-center gap-2"
                >
                  <Factory className="h-4 w-4" />
                  Minta Produksi {shortage} unit
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};