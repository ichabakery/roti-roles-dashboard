
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleType } from '@/contexts/AuthContext';

interface Branch {
  id: string;
  name: string;
}

interface BranchSelectorProps {
  userRole?: RoleType;
  branches: Branch[];
  selectedBranch: string | null;
  onBranchChange: (branchId: string) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  userRole,
  branches,
  selectedBranch,
  onBranchChange
}) => {
  if (userRole !== 'owner' && userRole !== 'admin_pusat') {
    return null;
  }

  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-1 block">Cabang</label>
      <Select
        value={selectedBranch || ''}
        onValueChange={onBranchChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih Cabang" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
