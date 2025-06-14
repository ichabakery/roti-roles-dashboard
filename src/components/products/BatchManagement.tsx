
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Archive, Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useProductBatches } from '@/hooks/useProductBatches';
import { useBranches } from '@/hooks/useBranches';

export const BatchManagement = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [newBatch, setNewBatch] = useState({
    productId: '',
    batchNumber: '',
    quantity: 0,
    productionDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const { products } = useProducts();
  const { branches } = useBranches();
  const { batches, loading, addBatch, updateStatus } = useProductBatches(selectedBranch);

  const regularProducts = products.filter(p => p.active && p.product_type === 'regular');

  const handleAddBatch = async () => {
    if (!newBatch.productId || !selectedBranch || !newBatch.batchNumber || !newBatch.expiryDate) {
      return;
    }

    const success = await addBatch({
      ...newBatch,
      branchId: selectedBranch
    });

    if (success) {
      setNewBatch({
        productId: '',
        batchNumber: '',
        quantity: 0,
        productionDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
      });
    }
  };

  const getStatusBadge = (status: string, expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (status === 'expired' || daysDiff < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysDiff <= 1) {
      return <Badge variant="destructive">Expires Today</Badge>;
    } else if (daysDiff <= 3) {
      return <Badge variant="secondary">Expires Soon</Badge>;
    } else if (status === 'sold_out') {
      return <Badge variant="outline">Sold Out</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Manajemen Batch Produk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="branch">Pilih Cabang</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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

            {selectedBranch && (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold">Tambah Batch Baru</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product">Produk</Label>
                    <Select 
                      value={newBatch.productId} 
                      onValueChange={(value) => setNewBatch(prev => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {regularProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="batch-number">Nomor Batch</Label>
                    <Input
                      placeholder="BTH-20241214-001"
                      value={newBatch.batchNumber}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, batchNumber: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newBatch.quantity || ''}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="production-date">Tanggal Produksi</Label>
                    <Input
                      type="date"
                      value={newBatch.productionDate}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, productionDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expiry-date">Tanggal Expired</Label>
                    <Input
                      type="date"
                      value={newBatch.expiryDate}
                      onChange={(e) => setNewBatch(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleAddBatch} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Batch
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedBranch && (
              <div className="space-y-4">
                <h4 className="font-semibold">Daftar Batch</h4>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : batches.length > 0 ? (
                  <div className="space-y-2">
                    {batches.map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{batch.product?.name}</span>
                            {getStatusBadge(batch.status, batch.expiry_date)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Batch: {batch.batch_number} | Qty: {batch.quantity} | 
                            Expired: {new Date(batch.expiry_date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStatus(batch.id, 'expired')}
                            disabled={batch.status === 'expired'}
                          >
                            Mark Expired
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Belum ada batch untuk cabang ini</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
