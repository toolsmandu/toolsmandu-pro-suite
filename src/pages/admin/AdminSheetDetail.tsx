import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Sheet = { id: string; name: string; createdAt: string };

type Row = {
  id: string;
  orderId: string;
  purchaseDate: string;
  email: string;
  phone: string;
  period: string;
  remaining: string;
  remarks: string;
};

const SHEETS_KEY = "admin_sheets_list";
const rowsKey = (id: string) => `admin_sheet_rows_${id}`;

const COLUMNS: { key: keyof Omit<Row, "id">; label: string; type?: string }[] = [
  { key: "orderId", label: "Order ID" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "period", label: "Period" },
  { key: "remaining", label: "Remaining" },
  { key: "remarks", label: "Remarks" },
];

const emptyRow = (): Row => ({
  id: crypto.randomUUID(),
  orderId: "",
  purchaseDate: "",
  email: "",
  phone: "",
  period: "",
  remaining: "",
  remarks: "",
});

const AdminSheetDetail = () => {
  const { id = "" } = useParams();
  const [rows, setRows] = useState<Row[]>([]);

  const sheet = useMemo<Sheet | null>(() => {
    try {
      const list: Sheet[] = JSON.parse(
        localStorage.getItem(SHEETS_KEY) || "[]",
      );
      return list.find((s) => s.id === id) || null;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(rowsKey(id));
      setRows(raw ? JSON.parse(raw) : []);
    } catch {
      setRows([]);
    }
  }, [id]);

  const persist = (next: Row[]) => {
    setRows(next);
    localStorage.setItem(rowsKey(id), JSON.stringify(next));
  };

  const updateCell = (rowId: string, key: keyof Row, value: string) => {
    persist(rows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
  };

  const addRow = () => persist([...rows, emptyRow()]);
  const deleteRow = (rowId: string) =>
    persist(rows.filter((r) => r.id !== rowId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/sheets" aria-label="Back to sheets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {sheet?.name || "Sheet"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </p>
          </div>
        </div>
        <Button onClick={addRow}>
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-muted/30 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              {COLUMNS.map((c) => (
                <TableHead key={c.key} className="whitespace-nowrap border-r border-border last:border-r-0">
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="text-right border-r border-border last:border-r-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 1}
                  className="text-center text-muted-foreground py-8"
                >
                  No rows yet. Click "Add Row" to start.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={idx % 2 === 1 ? "bg-muted/40" : ""}
                >
                  {COLUMNS.map((c) => (
                    <TableCell key={c.key} className="p-1 align-top">
                      <Input
                        type={c.type || "text"}
                        value={row[c.key] as string}
                        onChange={(e) =>
                          updateCell(row.id, c.key, e.target.value)
                        }
                        className="h-9 border-transparent focus:border-input bg-transparent"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(row.id)}
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSheetDetail;
