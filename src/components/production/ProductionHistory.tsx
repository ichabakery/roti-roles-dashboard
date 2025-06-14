
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductionRequest } from '@/hooks/useProduction';
import { format, parseISO } from 'date-fns';

interface ProductionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedRequests: ProductionRequest[];
  cancelledRequests: ProductionRequest[];
  loading: boolean;
  onViewDetails: (request: ProductionRequest) => void;
}

const ProductionHistory: React.FC<ProductionHistoryProps> = ({
  open,
  onOpenChange,
  completedRequests,
  cancelledRequests,
  loading,
  onViewDetails
}) => {
  const [activeTab, setActiveTab] = useState<'completed' | 'cancelled'>('completed');

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const renderRequests = (requests: ProductionRequest[]) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-6">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Tidak ada data</p>
        </div>
      );
    }

    return requests.map((request) => (
      <div 
        key={request.id}
        className="p-4 border rounded-md mb-3 cursor-pointer hover:bg-muted/50"
        onClick={() => onViewDetails(request)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{request.productName}</h4>
            <p className="text-sm text-muted-foreground">
              {request.branchName} · {formatDate(request.production_date)}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={
              activeTab === 'completed' 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }
          >
            {activeTab === 'completed' ? 'Selesai' : 'Dibatalkan'}
          </Badge>
        </div>
        <div className="mt-2">
          <span className="text-sm font-medium">Jumlah: </span>
          <span className="text-sm">
            {request.quantity_produced || request.quantity_requested} dari {request.quantity_requested}
          </span>
        </div>
      </div>
    ));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-[90vw]">
        <SheetHeader>
          <SheetTitle>Riwayat Produksi</SheetTitle>
          <SheetDescription>
            Riwayat permintaan produksi yang telah selesai atau dibatalkan
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex border-b mb-4">
            <Button 
              variant="ghost" 
              className={`flex-1 rounded-none ${activeTab === 'completed' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Selesai
            </Button>
            <Button 
              variant="ghost" 
              className={`flex-1 rounded-none ${activeTab === 'cancelled' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Dibatalkan
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="pr-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderRequests(activeTab === 'completed' ? completedRequests : cancelledRequests)
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductionHistory;
