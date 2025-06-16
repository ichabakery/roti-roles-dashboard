
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PendingTransaction {
  id: string;
  total_amount: number;
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
  payment_status: string;
  transaction_date: string;
  branches?: { name: string } | null;
  payment_method: string;
}

interface PendingTransactionCardProps {
  transaction: PendingTransaction;
  isSelected: boolean;
  onSelect: (transaction: PendingTransaction) => void;
}

export const PendingTransactionCard: React.FC<PendingTransactionCardProps> = ({
  transaction,
  isSelected,
  onSelect
}) => {
  const getStatusBadge = (status: string, dueDate: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    
    if (isOverdue) {
      return <Badge variant="destructive">Jatuh Tempo</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'partial':
        return <Badge variant="outline">Sebagian</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(transaction.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;

  return (
    <Card 
      className={`cursor-pointer transition-colors ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'hover:bg-muted/50'
      } ${isOverdue ? 'border-destructive' : ''}`}
      onClick={() => onSelect(transaction)}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium text-sm">
              ID: {transaction.id.substring(0, 8)}...
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
            </p>
          </div>
          {getStatusBadge(transaction.payment_status, transaction.due_date)}
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total:</span>
            <span>Rp {transaction.total_amount.toLocaleString('id-ID')}</span>
          </div>
          {transaction.amount_paid && (
            <div className="flex justify-between">
              <span>Dibayar:</span>
              <span>Rp {transaction.amount_paid.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Sisa:</span>
            <span>Rp {(transaction.amount_remaining || transaction.total_amount).toLocaleString('id-ID')}</span>
          </div>
          {transaction.due_date && (
            <div className="flex justify-between items-center">
              <span>Jatuh Tempo:</span>
              <span className={isOverdue ? 'text-destructive' : ''}>
                {new Date(transaction.due_date).toLocaleDateString('id-ID')}
                {daysUntilDue !== null && (
                  <span className="ml-1">
                    ({isOverdue ? `${Math.abs(daysUntilDue)} hari terlewat` : `${daysUntilDue} hari lagi`})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
