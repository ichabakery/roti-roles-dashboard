import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, X, Package, Edit } from 'lucide-react';
import { EnhancedProductSelector } from './EnhancedProductSelector';
import { toast } from '@/hooks/use-toast';
import { orderService, type Order, type OrderItem } from '@/services/orderService';

interface EditOrderDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: (updatedOrder: Order) => void;
}

export function EditOrderDialog({ 
  open, 
  onClose, 
  order,
  onOrderUpdated 
}: EditOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_date: '',
    shipping_cost: 0,
    notes: ''
  });

  // Load order data when dialog opens
  useEffect(() => {
    if (open && order) {
      setFormData({
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        delivery_date: order.delivery_date || '',
        shipping_cost: order.shipping_cost || 0,
        notes: order.notes || ''
      });
      
      // Parse items
      const orderItems = Array.isArray(order.items) ? order.items : [];
      setItems(orderItems.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })));
    }
  }, [open, order]);

  const handleAddItem = (item: OrderItem) => {
    const existingItemIndex = items.findIndex(i => i.productId === item.productId);
    
    if (existingItemIndex >= 0) {
      const newItems = [...items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + item.quantity
      };
      setItems(newItems);
    } else {
      setItems([...items, item]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.shipping_cost || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order?.id) return;
    
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pesanan harus memiliki minimal 1 produk"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedOrder = await orderService.updateOrder(order.id, {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        delivery_date: formData.delivery_date,
        shipping_cost: formData.shipping_cost,
        notes: formData.notes,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      });
      
      toast({
        title: "Pesanan Berhasil Diperbarui",
        description: `Pesanan ${order.order_number} telah diperbarui.`
      });
      
      onOrderUpdated(updatedOrder);
      onClose();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        variant: "destructive",
        title: "Gagal memperbarui pesanan",
        description: error.message || "Terjadi kesalahan saat memperbarui pesanan."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Pesanan {order.order_number}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Informasi Pelanggan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nama Pelanggan *</Label>
                  <Input
                    id="customerName"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Detail Pesanan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal Pesan</Label>
                  <Input
                    type="date"
                    value={order.order_date}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryDate">Tanggal Pengambilan *</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <EnhancedProductSelector 
            branchId={order.branch_id}
            onAddItem={handleAddItem}
          />

          {/* Order Items */}
          {items.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Item Pesanan</h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          Rp {item.unitPrice.toLocaleString()} per unit
                        </div>
                      </div>
                      <Input
                        type="number"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <div className="text-right min-w-[100px]">
                        <div className="font-medium">
                          Rp {(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Pricing Summary */}
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal Produk:</span>
                    <span>Rp {calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shippingCost" className="text-sm">Ongkir:</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      className="w-32 text-right"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan khusus untuk pesanan ini..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || items.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
