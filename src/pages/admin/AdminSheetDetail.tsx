import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
const widthsKey = (id: string) => `admin_sheet_widths_${id}`;

const COLUMNS: { key: keyof Omit<Row, "id">; label: string; type?: string }[] = [
  { key: "orderId", label: "Order ID" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "period", label: "Period" },
  { key: "remaining", label: "Remaining" },
  { key: "remarks", label: "Remarks" },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  orderId: 140,
  purchaseDate: 160,
  email: 220,
  phone: 150,
  period: 120,
  remaining: 120,
  remarks: 240,
  actions: 90,
};

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
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(
    null,
  );

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
      const w = localStorage.getItem(widthsKey(id));
      setWidths({ ...DEFAULT_WIDTHS, ...(w ? JSON.parse(w) : {}) });
    } catch {
      setRows([]);
    }
  }, [id]);

  const persistRows = (next: Row[]) => {
    setRows(next);
    localStorage.setItem(rowsKey(id), JSON.stringify(next));
  };

  const persistWidths = (next: Record<string, number>) => {
    setWidths(next);
    localStorage.setItem(widthsKey(id), JSON.stringify(next));
  };

  const updateCell = (rowId: string, key: keyof Row, value: string) => {
    persistRows(rows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
  };

  const addRow = () => persistRows([...rows, emptyRow()]);
  const deleteRow = (rowId: string) =>
    persistRows(rows.filter((r) => r.id !== rowId));

  const startResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      key,
      startX: e.clientX,
      startW: widths[key] ?? 120,
    };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const next = Math.max(60, d.startW + (ev.clientX - d.startX));
      setWidths((prev) => ({ ...prev, [d.key]: next }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setWidths((prev) => {
        localStorage.setItem(widthsKey(id), JSON.stringify(prev));
        return prev;
      });
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const allCols = [
    ...COLUMNS.map((c) => ({ key: c.key as string, label: c.label })),
    { key: "actions", label: "Actions" },
  ];

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
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {allCols.map((c) => (
              <col key={c.key} style={{ width: widths[c.key] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-muted/60">
              {allCols.map((c) => (
                <th
                  key={c.key}
                  className="relative h-10 px-3 text-left align-middle font-medium text-muted-foreground border-r border-border last:border-r-0 select-none"
                >
                  <span className="block truncate">{c.label}</span>
                  <span
                    onMouseDown={(e) => startResize(c.key, e)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={allCols.length}
                  className="text-center text-muted-foreground py-8"
                >
                  No rows yet. Click "Add Row" to start.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={idx % 2 === 1 ? "bg-muted/40" : ""}
                >
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className="p-1 align-top border-r border-border border-t"
                    >
                      <Input
                        type={c.type || "text"}
                        value={row[c.key] as string}
                        onChange={(e) =>
                          updateCell(row.id, c.key, e.target.value)
                        }
                        className="h-9 border-transparent focus:border-input bg-transparent"
                      />
                    </td>
                  ))}
                  <td className="text-right border-t border-border p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(row.id)}
                      aria-label="Delete row"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSheetDetail;
