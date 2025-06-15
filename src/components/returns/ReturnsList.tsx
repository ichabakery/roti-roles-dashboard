
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, Filter, MapPin } from 'lucide-react';
import { fetchReturns } from '@/services/returnService';
import { Return } from '@/types/products';
import { ReturnDetailDialog } from './ReturnDetailDialog';
import { useUserBranch } from '@/hooks/useUserBranch';
import { format } from 'date-fns';

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

  useEffect(() => {
    loadReturns();
  }, [userRole, userBranch.branchId]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      // For kasir_cabang, only load returns from their branch
      const branchFilter = userRole === 'kasir_cabang' ? userBranch.branchId : undefined;
      const data = await fetchReturns(branchFilter);
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
                         ((returnItem as any).branch?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  if (loading) {
    return <div className="text-center py-8">Memuat data retur...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
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
                        {(returnItem as any).branch?.name || 'Unknown'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{returnItem.reason}</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {returnItem.notes || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(returnItem)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detail
                    </Button>
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
    </div>
  );
};
