
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LayoutGrid, Table2 } from 'lucide-react';
import { ReturnCondition } from '@/types/products';
import { BulkReturnTable } from './BulkReturnTable';
import { QuickReturnGrid } from './QuickReturnGrid';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
}

interface HybridReturnInputProps {
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  products: Array<{ id: string; name: string; active: boolean; }>;
}

const conditionOptions = [
  { value: 'resaleable', label: 'Bisa Dijual Ulang' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'sample', label: 'Icipan' },
  { value: 'bonus', label: 'Imbohan' }
];

export const HybridReturnInput: React.FC<HybridReturnInputProps> = ({
  returnItems,
  setReturnItems,
  products
}) => {
  const isMobile = useIsMobile();
  const [defaultCondition, setDefaultCondition] = useState<ReturnCondition>('resaleable');
  const [defaultReason, setDefaultReason] = useState('');
  const [applyToAll, setApplyToAll] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(isMobile ? 'grid' : 'table');

  // When default values change and applyToAll is true, update existing items
  const handleConditionChange = (value: ReturnCondition) => {
    setDefaultCondition(value);
    if (applyToAll && returnItems.length > 0) {
      setReturnItems(prev => prev.map(item => ({ ...item, condition: value })));
    }
  };

  const handleReasonChange = (value: string) => {
    setDefaultReason(value);
    if (applyToAll && returnItems.length > 0) {
      setReturnItems(prev => prev.map(item => ({ ...item, reason: value })));
    }
  };

  const handleApplyToAllChange = (checked: boolean) => {
    setApplyToAll(checked);
    if (checked && returnItems.length > 0) {
      setReturnItems(prev => prev.map(item => ({
        ...item,
        condition: defaultCondition,
        reason: defaultReason
      })));
    }
  };

  return (
    <div className="space-y-4">
      {/* Default Values Header */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Pengaturan Default</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-to-all"
              checked={applyToAll}
              onCheckedChange={handleApplyToAllChange}
            />
            <label
              htmlFor="apply-to-all"
              className="text-sm cursor-pointer"
            >
              Terapkan ke semua produk
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Kondisi Produk</Label>
            <Select 
              value={defaultCondition} 
              onValueChange={(value) => handleConditionChange(value as ReturnCondition)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Alasan Umum</Label>
            <Input
              value={defaultReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="Alasan yang berlaku untuk semua produk"
            />
          </div>
        </div>
      </div>

      {/* Input Mode Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-semibold">Produk yang Diretur</Label>
          <TabsList className="h-8">
            <TabsTrigger value="grid" className="h-7 px-3 text-xs gap-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="h-7 px-3 text-xs gap-1">
              <Table2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-0">
          <QuickReturnGrid
            returnItems={returnItems}
            setReturnItems={setReturnItems}
            products={products}
            defaultCondition={defaultCondition}
            defaultReason={defaultReason}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <BulkReturnTable
            returnItems={returnItems}
            setReturnItems={setReturnItems}
            products={products}
            defaultCondition={defaultCondition}
            defaultReason={defaultReason}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
