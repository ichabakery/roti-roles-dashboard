
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Search, Filter, MapPin, Check, X, Loader2 } from 'lucide-react';
import { fetchReturns, processReturn } from '@/services/returnService';
import { Return } from '@/types/products';
import { ReturnDetailDialog } from './ReturnDetailDialog';
import { useUserBranch } from '@/hooks/useUserBranch';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReturnsListProps {
  canApprove: boolean;
  userRole?: string;
}

export const ReturnsList: React.FC<ReturnsListProps> = ({ canApprove, userRole }) => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { userBranch } = useUserBranch();
  
  // Quick action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    returnItem: Return | null;
    action: 'approve' | 'reject';
  }>({ open: false, returnItem: null, action: 'approve' });
  
  // Auto-confirm toggle
  const [autoConfirm, setAutoConfirm] = useState(() => {
    return localStorage.getItem('returnAutoConfirm') === 'true';
  });

  useEffect(() => {
    loadReturns();
  }, [userRole, userBranch.branchId]);

  useEffect(() => {
    localStorage.setItem('returnAutoConfirm', autoConfirm.toString());
  }, [autoConfirm]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      console.log('Loading returns with userRole:', userRole, 'branchId:', userBranch.branchId);
      
      // For kasir_cabang, only load returns from their branch
      const branchFilter = userRole === 'kasir_cabang' ? userBranch.branchId : undefined;
      console.log('Using branch filter:', branchFilter);
      
      const data = await fetchReturns(branchFilter);
      console.log('Returns loaded:', data);
      setReturns(data);
    } catch (error) {
      console.error('Error loading returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Menunggu</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         returnItem.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ((returnItem as any).branches?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setDetailDialogOpen(true);
  };

  const handleReturnProcessed = () => {
    loadReturns(); // Reload data after processing
  };

  const handleQuickAction = async (returnItem: Return, action: 'approve' | 'reject') => {
    if (autoConfirm && action === 'approve') {
      // Auto-confirm mode - process immediately
      await executeQuickAction(returnItem, action);
    } else {
      // Show confirmation dialog
      setConfirmDialog({ open: true, returnItem, action });
    }
  };

  const executeQuickAction = async (returnItem: Return, action: 'approve' | 'reject') => {
    try {
      setProcessingId(returnItem.id);
      await processReturn(returnItem.id, action, `Quick ${action} by ${userRole}`);
      toast.success(
        action === 'approve' 
          ? 'Retur berhasil disetujui' 
          : 'Retur berhasil ditolak'
      );
      loadReturns();
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Gagal memproses retur');
    } finally {
      setProcessingId(null);
      setConfirmDialog({ open: false, returnItem: null, action: 'approve' });
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.returnItem) {
      executeQuickAction(confirmDialog.returnItem, confirmDialog.action);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data retur...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Auto-Confirm Toggle */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan ID, alasan retur, atau cabang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-Confirm Toggle - Only for admin/owner */}
        {canApprove && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Switch
              id="auto-confirm"
              checked={autoConfirm}
              onCheckedChange={setAutoConfirm}
            />
            <Label htmlFor="auto-confirm" className="text-sm cursor-pointer">
              Auto-Confirm Retur
            </Label>
            {autoConfirm && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                ON
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Retur</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Tidak ada retur yang sesuai dengan filter'
                    : 'Belum ada retur yang dibuat'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">
                    {returnItem.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {format(new Date(returnItem.return_date), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {(returnItem as any).branches?.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{returnItem.reason}</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {returnItem.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick action buttons - only for pending items and admin/owner */}
                      {canApprove && returnItem.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleQuickAction(returnItem, 'approve')}
                            disabled={processingId === returnItem.id}
                            title="Setujui"
                          >
                            {processingId === returnItem.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleQuickAction(returnItem, 'reject')}
                            disabled={processingId === returnItem.id}
                            title="Tolak"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(returnItem)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <ReturnDetailDialog
        returnItem={selectedReturn}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        canApprove={canApprove}
        onReturnProcessed={handleReturnProcessed}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Konfirmasi Setujui Retur' : 'Konfirmasi Tolak Retur'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.returnItem && (
                <div className="space-y-2 mt-2">
                  <p><strong>ID:</strong> {confirmDialog.returnItem.id.substring(0, 8)}...</p>
                  <p><strong>Alasan:</strong> {confirmDialog.returnItem.reason}</p>
                  <p className="text-sm mt-2">
                    {confirmDialog.action === 'approve' 
                      ? 'Apakah Anda yakin ingin menyetujui retur ini? Stok akan dikembalikan untuk produk yang bisa dijual ulang.'
                      : 'Apakah Anda yakin ingin menolak retur ini?'
                    }
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={processingId !== null}
              className={confirmDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
