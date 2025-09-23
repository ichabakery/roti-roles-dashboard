
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coffee } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { Branch } from '@/hooks/useBranches';
import { NewProductionRequest } from '@/types/production';
import { useProductionForm } from '@/hooks/useProductionForm';
import ProductionRequestForm from './ProductionRequestForm';

interface NewProductionDialogProps {
  products: Product[];
  branches: Branch[];
  productsLoading: boolean;
  branchesLoading: boolean;
  onAddRequest: (request: NewProductionRequest) => Promise<any>;
}

const NewProductionDialog: React.FC<NewProductionDialogProps> = ({
  products,
  branches,
  productsLoading,
  branchesLoading,
  onAddRequest
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formData, handleChange, resetForm, isFormValid } = useProductionForm();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await onAddRequest(formData);
      if (result) {
        setOpen(false);
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Coffee className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Mulai Produksi Baru</span>
          <span className="sm:hidden">Produksi Baru</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Permintaan Produksi Baru</DialogTitle>
          <DialogDescription className="text-sm">
            Isi detail permintaan produksi. Klik Simpan ketika selesai.
          </DialogDescription>
        </DialogHeader>

        <ProductionRequestForm
          formData={formData}
          products={products}
          branches={branches}
          productsLoading={productsLoading}
          branchesLoading={branchesLoading}
          loading={loading}
          onFieldChange={handleChange}
        />

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid() || loading}
            className={`w-full sm:w-auto order-1 sm:order-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProductionDialog;
