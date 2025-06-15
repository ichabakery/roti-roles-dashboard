
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Printer } from 'lucide-react';
import { useExportReports } from '@/hooks/useExportReports';
import type { Transaction } from '@/types/reports';

interface ExportButtonsProps {
  transactions: Transaction[];
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ transactions }) => {
  const { exportTransactions, printReport } = useExportReports();

  const handleExportExcel = () => {
    exportTransactions(transactions);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('PDF export not implemented yet');
  };

  const handlePrint = () => {
    printReport();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileText className="mr-2 h-4 w-4" />
          Export ke Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Export ke PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak Laporan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
