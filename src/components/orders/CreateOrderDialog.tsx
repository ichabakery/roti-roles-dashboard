import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import type { OrderFormData, OrderItem } from '@/services/orderService';

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
}

export function CreateOrderDialog({ open, onClose, onSubmit }: CreateOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customer_name: '',
    customer_phone: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    notes: '',
    items: []
  });

  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    productName: '',
    quantity: 1,
    unitPrice: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Pesanan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nama Pelanggan</Label>
            <Input
              id="customerName"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Nomor Telepon</Label>
            <Input
              id="phoneNumber"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderDate">Tanggal Pesan</Label>
            <Input
              id="orderDate"
              type="date"
              value={formData.order_date}
              onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              required
            />
          </div>
          {/* Item Pesanan */}
          <div className="space-y-4">
            <Label>Item Pesanan</Label>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input 
                      value={item.productName} 
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index] = { ...item, productName: e.target.value };
                        setFormData({ ...formData, items: newItems });
                      }}
                      placeholder="Nama Produk"
                    />
                  </div>
                  <Input 
                    type="number"
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index] = { ...item, quantity: parseInt(e.target.value) || 0 };
                      setFormData({ ...formData, items: newItems });
                    }}
                    min="1"
                  />
                  <Input 
                    type="number"
                    className="w-32"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index] = { ...item, unitPrice: parseInt(e.target.value) || 0 };
                      setFormData({ ...formData, items: newItems });
                    }}
                    placeholder="Harga"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      const newItems = formData.items.filter((_, i) => i !== index);
                      setFormData({ ...formData, items: newItems });
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new item form */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input 
                  value={newItem.productName}
                  onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                  placeholder="Nama Produk"
                />
              </div>
              <Input 
                type="number"
                className="w-20"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="Jumlah"
              />
              <Input 
                type="number"
                className="w-32"
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: parseInt(e.target.value) || 0 })}
                placeholder="Harga"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (newItem.productName && newItem.quantity && newItem.unitPrice) {
                    setFormData({
                      ...formData,
                      items: [...formData.items, newItem as OrderItem]
                    });
                    setNewItem({
                      productName: '',
                      quantity: 1,
                      unitPrice: 0
                    });
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Input
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
