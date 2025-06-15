
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useEnhancedProducts } from '@/hooks/useEnhancedProducts';
import { useBranches } from '@/hooks/useBranches';
import { createReturn } from '@/services/returnService';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: 'resaleable' | 'damaged' | 'expired';
}

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
}

export const CreateReturnDialog: React.FC<CreateReturnDialogProps> = ({
  open,
  onOpenChange,
  userRole
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    reason: '',
    notes: '',
    transactionId: ''
  });
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([{
    productId: '',
    quantity: 1,
    reason: '',
    condition: 'resaleable' as const
  }]);

  const { toast } = useToast();
  const { products } = useEnhancedProducts();
  const { branches } = useBranches();

  const reasonOptions = [
    'Produk rusak/cacat',
    'Produk kadaluarsa',
    'Salah pesanan',
    'Tidak sesuai harapan pelanggan',
    'Stok berlebih (cabang)',
    'Rotasi stok',
    'Lainnya'
  ];

  const conditionOptions = [
    { value: 'resaleable', label: 'Bisa Dijual Ulang' },
    { value: 'damaged', label: 'Rusak' },
    { value: 'expired', label: 'Kadaluarsa' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId || returnItems.some(item => !item.productId)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib"
      });
      return;
    }

    setLoading(true);

    try {
      await createReturn({
        branchId: formData.branchId,
        reason: formData.reason,
        notes: formData.notes,
        transactionId: formData.transactionId || undefined,
        items: returnItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
          condition: item.condition
        }))
      });

      toast({
        title: "Berhasil",
        description: "Retur berhasil dibuat dan menunggu persetujuan"
      });

      // Reset form
      setFormData({ branchId: '', reason: '', notes: '', transactionId: '' });
      setReturnItems([{ productId: '', quantity: 1, reason: '', condition: 'resaleable' }]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating return:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal membuat retur: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const addReturnItem = () => {
    setReturnItems([...returnItems, {
      productId: '',
      quantity: 1,
      reason: '',
      condition: 'resaleable'
    }]);
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const updateReturnItem = (index: number, field: keyof ReturnItem, value: any) => {
    const updated = [...returnItems];
    updated[index] = { ...updated[index], [field]: value };
    setReturnItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Retur Baru</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branch">Cabang *</Label>
              <Select value={formData.branchId} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, branchId: value }))
              }>
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

            <div>
              <Label htmlFor="transactionId">ID Transaksi (Opsional)</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  transactionId: e.target.value 
                }))}
                placeholder="Masukkan ID transaksi jika ada"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Alasan Retur *</Label>
            <Select value={formData.reason} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, reason: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Pilih alasan retur" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Return Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Produk yang Diretur</Label>
              <Button type="button" variant="outline" onClick={addReturnItem}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </div>

            {returnItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Produk #{index + 1}</h4>
                  {returnItems.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeReturnItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Produk *</Label>
                    <Select 
                      value={item.productId} 
                      onValueChange={(value) => updateReturnItem(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.filter(p => p.active).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Jumlah *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alasan Spesifik</Label>
                    <Input
                      value={item.reason}
                      onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                      placeholder="Alasan detail untuk produk ini"
                    />
                  </div>

                  <div>
                    <Label>Kondisi Produk *</Label>
                    <Select 
                      value={item.condition} 
                      onValueChange={(value) => updateReturnItem(index, 'condition', value)}
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
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Catatan atau keterangan tambahan"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Buat Retur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
