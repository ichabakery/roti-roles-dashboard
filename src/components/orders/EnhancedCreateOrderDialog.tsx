import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, X, MapPin, Package } from 'lucide-react';
import { EnhancedProductSelector } from './EnhancedProductSelector';
import { useBranches } from '@/hooks/useBranches';
import { toast } from '@/hooks/use-toast';
import type { OrderFormData } from '@/services/orderService';

interface EnhancedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface EnhancedCreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (orderData: any) => void;
  currentBranchId: string;
}

export function EnhancedCreateOrderDialog({ 
  open, 
  onClose, 
  onSubmit,
  currentBranchId 
}: EnhancedCreateOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<EnhancedOrderItem[]>([]);

  const { branches } = useBranches();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    pickup_branch_id: currentBranchId,
    payment_type: 'cash_on_delivery' as 'cash_on_delivery' | 'dp' | 'full_payment',
    dp_amount: 0,
    delivery_address: '',
    notes: ''
  });

  const handleAddItem = (item: EnhancedOrderItem) => {
    const existingItemIndex = items.findIndex(i => i.productId === item.productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + item.quantity
      };
      setItems(newItems);
    } else {
      // Add new item
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

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Tambahkan minimal 1 produk ke pesanan');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData: any = {
        ...formData,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      console.log('Submitting order data:', orderData);
      const result = await onSubmit(orderData);
      console.log('Order submit result:', result);
      
      toast({
        variant: "default",
        title: "Pesanan Berhasil Dibuat!",
        description: "Pesanan berhasil disimpan.",
      });
      
      // Reset form
      setItems([]);
      setFormData({
        customer_name: '',
        customer_phone: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        pickup_branch_id: currentBranchId,
        payment_type: 'cash_on_delivery',
        dp_amount: 0,
        delivery_address: '',
        notes: ''
      });
      
      console.log('Order submitted successfully, dialog will close');
      onClose();
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Gagal membuat pesanan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Buat Pesanan Baru
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
                  <Label htmlFor="orderDate">Tanggal Pesan *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    required
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
                <div>
                  <Label htmlFor="pickupBranch">Lokasi Pengambilan</Label>
                  <Select 
                    value={formData.pickup_branch_id} 
                    onValueChange={(value) => setFormData({ ...formData, pickup_branch_id: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih lokasi pengambilan..." />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border shadow-lg">
                      {/* Render branches grouped by type */}
                      {branches.filter(branch => branch.location_type === 'branch' || !branch.location_type).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                            Cabang Toko
                          </div>
                          {branches
                            .filter(branch => branch.location_type === 'branch' || !branch.location_type)
                            .map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  {branch.name}
                                </div>
                              </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Admin and Management Offices */}
                      {branches.filter(branch => ['admin_office', 'management_office'].includes(branch.location_type || '')).length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50 border-t">
                            Kantor Pusat
                          </div>
                          {branches
                            .filter(branch => ['admin_office', 'management_office'].includes(branch.location_type || ''))
                            .map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-orange-600" />
                                  {branch.name}
                                </div>
                              </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentType">Tipe Pembayaran</Label>
                  <Select 
                    value={formData.payment_type} 
                    onValueChange={(value: any) => setFormData({ ...formData, payment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_on_delivery">Bayar saat ambil</SelectItem>
                      <SelectItem value="dp">DP (Uang Muka)</SelectItem>
                      <SelectItem value="full_payment">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.payment_type === 'dp' && (
                <div>
                  <Label htmlFor="dpAmount">Jumlah DP</Label>
                  <Input
                    id="dpAmount"
                    type="number"
                    value={formData.dp_amount}
                    onChange={(e) => setFormData({ ...formData, dp_amount: parseInt(e.target.value) || 0 })}
                    placeholder="Rp 0"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="deliveryAddress">Alamat Pengiriman (Opsional)</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="Alamat lengkap jika perlu dikirim"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <EnhancedProductSelector 
            branchId={currentBranchId}
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
                          Rp {item.unitPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          = Rp {(item.quantity * item.unitPrice).toLocaleString()}
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
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Pesanan:</span>
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
              Buat Pesanan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
