
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DailySalesReportItem, DailySalesReportSummary } from '@/services/dailySalesReportService';
import { Skeleton } from '@/components/ui/skeleton';

interface DailySalesTableProps {
  items: DailySalesReportItem[];
  summary: DailySalesReportSummary;
  loading: boolean;
}

export const DailySalesTable: React.FC<DailySalesTableProps> = ({
  items,
  summary,
  loading
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada data untuk tanggal yang dipilih
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center font-bold">NO</TableHead>
            <TableHead className="font-bold">NAMA BARANG</TableHead>
            <TableHead className="text-right font-bold">HARGA</TableHead>
            <TableHead className="text-center font-bold">STOK AWAL</TableHead>
            <TableHead className="text-center font-bold">STOCK MASUK</TableHead>
            <TableHead className="text-center font-bold">RETUR</TableHead>
            <TableHead className="text-center font-bold">PENJUALAN</TableHead>
            <TableHead className="text-center font-bold">STOK AKHIR</TableHead>
            <TableHead className="text-right font-bold">PENDAPATAN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.product_id}>
              <TableCell className="text-center">{item.no}</TableCell>
              <TableCell className="font-medium">{item.product_name}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-center">{item.stok_awal}</TableCell>
              <TableCell className="text-center">
                {item.stock_masuk > 0 ? (
                  <span className="text-green-600">+{item.stock_masuk}</span>
                ) : (
                  item.stock_masuk
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.retur > 0 ? (
                  <span className="text-orange-600">{item.retur}</span>
                ) : (
                  item.retur
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.penjualan > 0 ? (
                  <span className="text-blue-600">{item.penjualan}</span>
                ) : (
                  item.penjualan
                )}
              </TableCell>
              <TableCell className="text-center font-medium">{item.stok_akhir}</TableCell>
              <TableCell className="text-right font-medium">
                {item.pendapatan > 0 ? (
                  <span className="text-green-600">{formatCurrency(item.pendapatan)}</span>
                ) : (
                  formatCurrency(item.pendapatan)
                )}
              </TableCell>
            </TableRow>
          ))}
          
          {/* Total Row */}
          <TableRow className="bg-muted font-bold border-t-2">
            <TableCell colSpan={4} className="text-right">TOTAL</TableCell>
            <TableCell className="text-center text-green-600">
              +{summary.total_stock_masuk}
            </TableCell>
            <TableCell className="text-center text-orange-600">
              {summary.total_retur}
            </TableCell>
            <TableCell className="text-center text-blue-600">
              {summary.total_penjualan}
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right text-green-600">
              Rp {formatCurrency(summary.total_pendapatan)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
