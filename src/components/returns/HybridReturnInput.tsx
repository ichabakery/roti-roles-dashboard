
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Table2 } from 'lucide-react';
import { ReturnCondition } from '@/types/products';
import { BulkReturnTable } from './BulkReturnTable';
import { QuickReturnGrid } from './QuickReturnGrid';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReturnItem {
  productId: string;
  quantity: number;
  condition: ReturnCondition;
}

interface HybridReturnInputProps {
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  products: Array<{ id: string; name: string; active: boolean; }>;
  defaultCondition: ReturnCondition;
}

export const HybridReturnInput: React.FC<HybridReturnInputProps> = ({
  returnItems,
  setReturnItems,
  products,
  defaultCondition
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>(isMobile ? 'grid' : 'table');

  return (
    <div className="space-y-4">
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
          />
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <BulkReturnTable
            returnItems={returnItems}
            setReturnItems={setReturnItems}
            products={products}
            defaultCondition={defaultCondition}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
