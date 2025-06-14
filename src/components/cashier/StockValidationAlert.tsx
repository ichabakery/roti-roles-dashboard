
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface StockValidationAlertProps {
  branchError: string | null;
}

export const StockValidationAlert: React.FC<StockValidationAlertProps> = ({
  branchError
}) => {
  if (!branchError) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{branchError}</AlertDescription>
    </Alert>
  );
};
