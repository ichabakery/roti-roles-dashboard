
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, Edit, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
}

interface BulkSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onDeselectAll: () => void;
  actions: BulkAction[];
  itemLabel?: string;
  className?: string;
}

export const BulkSelectionToolbar: React.FC<BulkSelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onDeselectAll,
  actions,
  itemLabel = 'item',
  className
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
      "bg-background border shadow-lg rounded-lg px-4 py-3",
      "flex items-center gap-3 flex-wrap justify-center",
      "animate-in fade-in-0 slide-in-from-bottom-4 duration-200",
      className
    )}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
          {selectedCount}
        </span>
        <span className="text-muted-foreground">
          {itemLabel} dipilih dari {totalCount}
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'default'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="gap-2"
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDeselectAll}
        className="gap-1 text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">Batal</span>
      </Button>
    </div>
  );
};

// Pre-configured action buttons
export const DeleteBulkAction = (onClick: () => void, disabled?: boolean): BulkAction => ({
  id: 'delete',
  label: 'Hapus',
  icon: <Trash2 className="h-4 w-4" />,
  variant: 'destructive',
  onClick,
  disabled
});

export const EditBulkAction = (onClick: () => void, disabled?: boolean): BulkAction => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit className="h-4 w-4" />,
  variant: 'default',
  onClick,
  disabled
});

export const VoidBulkAction = (onClick: () => void, disabled?: boolean): BulkAction => ({
  id: 'void',
  label: 'Void',
  icon: <XCircle className="h-4 w-4" />,
  variant: 'destructive',
  onClick,
  disabled
});
