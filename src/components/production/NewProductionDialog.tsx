
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
        <Button>
          <Coffee className="mr-2 h-4 w-4" />
          Mulai Produksi Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Permintaan Produksi Baru</DialogTitle>
          <DialogDescription>
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

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid() || loading}
            className={loading ? "opacity-50 cursor-not-allowed" : ""}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProductionDialog;
