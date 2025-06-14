
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Coffee } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { Branch } from '@/hooks/useBranches';
import { NewProductionRequest } from '@/hooks/useProduction';

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
  const [formData, setFormData] = useState<NewProductionRequest>({
    product_id: '',
    branch_id: '',
    quantity_requested: 0,
    production_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (field: keyof NewProductionRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const resetForm = () => {
    setFormData({
      product_id: '',
      branch_id: '',
      quantity_requested: 0,
      production_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const isFormValid = () => {
    return (
      formData.product_id && 
      formData.branch_id && 
      formData.quantity_requested > 0 &&
      formData.production_date
    );
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

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="product">Produk</Label>
            <Select
              disabled={productsLoading || loading}
              value={formData.product_id}
              onValueChange={(value) => handleChange('product_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch">Cabang</Label>
            <Select
              disabled={branchesLoading || loading}
              value={formData.branch_id}
              onValueChange={(value) => handleChange('branch_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih cabang" />
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

          <div className="grid gap-2">
            <Label htmlFor="quantity">Jumlah</Label>
            <Input
              id="quantity"
              type="number"
              disabled={loading}
              min="1"
              value={formData.quantity_requested || ''}
              onChange={(e) => handleChange('quantity_requested', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Tanggal Produksi</Label>
            <Input
              id="date"
              type="date"
              disabled={loading}
              value={formData.production_date}
              onChange={(e) => handleChange('production_date', e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              disabled={loading}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan"
            />
          </div>
        </div>

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
