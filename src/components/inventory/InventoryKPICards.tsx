import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { InventoryKPI } from '@/types/products';
import { Skeleton } from '@/components/ui/skeleton';

interface InventoryKPICardsProps {
  kpis: InventoryKPI;
  loading: boolean;
}

export const InventoryKPICards: React.FC<InventoryKPICardsProps> = ({ kpis, loading }) => {
  const kpiItems = [
    {
      title: 'SKU Aktif',
      value: kpis.activeSKUs,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Unit On-Hand',
      value: `${kpis.totalUnits} pcs`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'SKU ≤ ROP',
      value: kpis.lowStockSKUs,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Kadaluarsa ≤ 3hr',
      value: kpis.expiringItems,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiItems.map((item, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold">
                  {typeof item.value === 'number' ? item.value.toLocaleString('id-ID') : item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};