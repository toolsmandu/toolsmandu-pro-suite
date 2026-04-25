import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
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

export type ExportFormat = 'xlsx' | 'csv';

export interface ExportSheet {
  name: string;
  rows: any[];
  /** Optional explicit header order */
  header?: string[];
}

interface PendingExport {
  filenameBase: string;
  sheets: ExportSheet[];
}

/**
 * Reusable hook to ask user for Excel vs CSV before exporting.
 *
 * Usage:
 *   const { requestExport, dialog } = useExportFormat();
 *   requestExport({ filenameBase: 'orders', sheets: [{ name: 'Orders', rows }] });
 *   // render {dialog}
 *
 * - XLSX export creates one workbook with all sheets.
 * - CSV export creates one file per sheet (suffixed with sheet name when >1).
 */
export function useExportFormat() {
  const [pending, setPending] = useState<PendingExport | null>(null);

  const requestExport = useCallback((req: PendingExport) => {
    setPending(req);
  }, []);

  const doExport = (fmt: ExportFormat) => {
    if (!pending) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    if (fmt === 'xlsx') {
      const wb = XLSX.utils.book_new();
      pending.sheets.forEach((s) => {
        const ws = s.header
          ? XLSX.utils.json_to_sheet(s.rows, { header: s.header })
          : XLSX.utils.json_to_sheet(s.rows);
        XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
      });
      XLSX.writeFile(wb, `${pending.filenameBase}-${ts}.xlsx`);
    } else {
      pending.sheets.forEach((s) => {
        const ws = s.header
          ? XLSX.utils.json_to_sheet(s.rows, { header: s.header })
          : XLSX.utils.json_to_sheet(s.rows);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = pending.sheets.length > 1 ? `-${s.name.replace(/\s+/g, '_')}` : '';
        a.download = `${pending.filenameBase}${suffix}-${ts}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
    setPending(null);
  };

  const dialog = (
    <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose export format</AlertDialogTitle>
          <AlertDialogDescription>
            How would you like to export the data?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => doExport('csv')}>Export as CSV</AlertDialogAction>
          <AlertDialogAction onClick={() => doExport('xlsx')}>Export as Excel</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestExport, dialog };
}
