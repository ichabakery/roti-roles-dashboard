
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReturnFormFieldsProps {
  formData: {
    branchId: string;
    reason: string;
    notes: string;
    transactionId: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    branchId: string;
    reason: string;
    notes: string;
    transactionId: string;
  }>>;
  branches: Array<{ id: string; name: string; }>;
  userRole?: string;
  userBranchName?: string;
}

const reasonOptions = [
  'Produk rusak/cacat',
  'Produk kadaluarsa',
  'Salah pesanan',
  'Tidak sesuai harapan pelanggan',
  'Stok berlebih (cabang)',
  'Rotasi stok',
  'Lainnya'
];

export const ReturnFormFields: React.FC<ReturnFormFieldsProps> = ({
  formData,
  setFormData,
  branches,
  userRole,
  userBranchName
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="branch">Cabang *</Label>
          {userRole === 'kasir_cabang' ? (
            <div className="p-3 bg-gray-50 border rounded-md">
              <span className="font-medium">{userBranchName || 'Loading...'}</span>
              <p className="text-sm text-muted-foreground">Cabang Anda</p>
            </div>
          ) : (
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
          )}
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
    </>
  );
};
