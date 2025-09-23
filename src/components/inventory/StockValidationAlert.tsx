import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Shield } from 'lucide-react';
import { isNegativeStockOverrideAllowed } from '@/utils/featureFlags';

interface StockValidationAlertProps {
  productName: string;
  availableStock: number;
  requiredStock: number;
  onOverride?: (reason: string) => void;
  onCancel: () => void;
}

export const StockValidationAlert: React.FC<StockValidationAlertProps> = ({
  productName,
  availableStock,
  requiredStock,
  onOverride,
  onCancel
}) => {
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [supervisorCode, setSupervisorCode] = useState('');
  const canOverride = isNegativeStockOverrideAllowed();

  const handleOverride = () => {
    if (!overrideReason.trim()) {
      return;
    }
    onOverride?.(overrideReason);
    setShowOverrideDialog(false);
    setOverrideReason('');
    setSupervisorCode('');
  };

  return (
    <>
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex flex-col space-y-2">
            <div>
              <strong>Stok tidak mencukupi untuk {productName}</strong>
            </div>
            <div className="text-sm">
              Tersedia: {availableStock} | Dibutuhkan: {requiredStock} | Kurang: {requiredStock - availableStock}
            </div>
            <div className="flex space-x-2 mt-3">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Batal
              </Button>
              {canOverride && onOverride && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setShowOverrideDialog(true)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Override dengan Persetujuan
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Shield className="h-5 w-5 mr-2" />
              Override Stok Negatif
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Peringatan:</strong> Anda akan melanjutkan transaksi yang menyebabkan stok negatif. 
                Tindakan ini memerlukan persetujuan supervisor dan alasan yang valid.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Override *</Label>
              <Textarea
                id="reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Contoh: Stok fisik tersedia tapi belum terinput sistem"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supervisorCode">Kode Supervisor</Label>
              <Input
                id="supervisorCode"
                type="password"
                value={supervisorCode}
                onChange={(e) => setSupervisorCode(e.target.value)}
                placeholder="Masukkan kode supervisor"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowOverrideDialog(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
              >
                Lanjutkan Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};