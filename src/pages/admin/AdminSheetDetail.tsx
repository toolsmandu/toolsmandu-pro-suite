import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Check, Save, CalendarIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatPurchaseDate = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const month = parseInt(m[2], 10);
  if (isNaN(month) || month < 1 || month > 12) return iso;
  return `${m[1]}/${MONTHS_SHORT[month - 1]}/${m[3]}`;
};
const isoFromDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

type Sheet = { id: string; name: string };

type RowKind = "master" | "normal";

type Row = {
  id: string;
  kind?: RowKind;
  orderId: string;
  purchaseDate: string;
  email: string;
  phone: string;
  period: string;
  remaining: string;
  remarks: string;
};

const MASTER_KEYS: (keyof Row)[] = ["email", "phone", "remarks"];
const isRowEmpty = (r: Row) =>
  !r.orderId && !r.purchaseDate && !r.email && !r.phone && !r.period && !r.remarks;

const widthsKey = (id: string) => `admin_sheet_widths_${id}`;

const COLUMNS: { key: keyof Omit<Row, "id">; label: string; type?: string }[] = [
  { key: "orderId", label: "Order ID" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "period", label: "Period (days)", type: "numeric" },
  { key: "remaining", label: "Remaining (days)" },
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
  actions: 110,
};

const emptyRow = (kind: RowKind = "normal"): Row => ({
  id: crypto.randomUUID(),
  kind,
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
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const [showEmpty, setShowEmpty] = useState(true);
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const rowsRef = useRef<Row[]>([]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);
  const [sheetUuid, setSheetUuid] = useState<string>("");

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  // Load sheet by id or slug
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const query = supabase.from("sheets").select("id, name, data");
      const { data, error } = isUuid(id)
        ? await query.eq("id", id).maybeSingle()
        : await query.eq("slug", id).maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Failed to load sheet", description: error.message, variant: "destructive" });
      } else if (data) {
        setSheet({ id: data.id, name: data.name });
        setSheetUuid(data.id);
        const arr = Array.isArray(data.data) ? (data.data as unknown as Row[]) : [];
        setRows(arr.map((r) => ({ ...r, id: r.id || crypto.randomUUID() })));
        setDirtyRows(new Set());
      }
      try {
        const w = localStorage.getItem(widthsKey(id));
        setWidths({ ...DEFAULT_WIDTHS, ...(w ? JSON.parse(w) : {}) });
      } catch {}
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const persistToDb = async (next: Row[]) => {
    const { error } = await supabase
      .from("sheets")
      .update({ data: next as unknown as any, updated_at: new Date().toISOString() })
      .eq("id", sheetUuid || id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const updateCell = (rowId: string, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
    setDirtyRows((prev) => {
      const n = new Set(prev);
      n.add(rowId);
      return n;
    });
  };

  const saveRow = async (rowId: string) => {
    setSavingRows((prev) => {
      const n = new Set(prev);
      n.add(rowId);
      return n;
    });
    const ok = await persistToDb(rowsRef.current);
    setSavingRows((prev) => {
      const n = new Set(prev);
      n.delete(rowId);
      return n;
    });
    if (ok) {
      setDirtyRows((prev) => {
        const n = new Set(prev);
        n.delete(rowId);
        return n;
      });
      toast({ title: "Changes Saved" });
    }
  };

  const addRow = () => {
    const newRows: Row[] = [
      emptyRow("master"),
      emptyRow("master"),
      emptyRow("normal"),
      emptyRow("normal"),
      emptyRow("normal"),
      emptyRow("normal"),
    ];
    setRows((prev) => [...prev, ...newRows]);
    setDirtyRows((prev) => {
      const n = new Set(prev);
      newRows.forEach((r) => n.add(r.id));
      return n;
    });
  };

  const deleteRow = async (rowId: string) => {
    const next = rowsRef.current.filter((r) => r.id !== rowId);
    setRows(next);
    setDirtyRows((prev) => {
      const n = new Set(prev);
      n.delete(rowId);
      return n;
    });
    await persistToDb(next);
  };

  const startResize = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { key, startX: e.clientX, startW: widths[key] ?? 120 };
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

  const allCols = useMemo(
    () => [
      ...COLUMNS.map((c) => ({ key: c.key as string, label: c.label })),
      { key: "actions", label: "Actions" },
    ],
    [],
  );

  const unsavedCount = dirtyRows.size;

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
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{rows.length} {rows.length === 1 ? "row" : "rows"}</span>
              {unsavedCount > 0 && (
                <span className="text-xs text-warning">
                  {unsavedCount} unsaved {unsavedCount === 1 ? "change" : "changes"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEmpty((v) => !v)} disabled={loading}>
            {showEmpty ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showEmpty ? "Hide Empty Rows" : "Show Empty Rows"}
          </Button>
          <Button onClick={addRow} disabled={loading}>
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-muted/30 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
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
                  {COLUMNS.map((c) => {
                    const isRemaining = c.key === "remaining";
                    const periodNum = parseInt(row.period, 10);
                    let remainingVal = "";
                    let remainingClass = "";
                    if (isRemaining && row.purchaseDate && !isNaN(periodNum)) {
                      const start = new Date(row.purchaseDate);
                      if (!isNaN(start.getTime())) {
                        const expiry = new Date(start);
                        expiry.setDate(expiry.getDate() + periodNum);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
                        remainingVal = String(diff);
                        remainingClass = diff < 0 ? "text-destructive font-medium" : diff <= 7 ? "text-warning font-medium" : "";
                      }
                    }
                    return (
                      <td
                        key={c.key}
                        className="p-1 align-top border-r border-border border-t"
                      >
                        {isRemaining ? (
                          <div className={`h-9 px-3 flex items-center text-sm ${remainingClass}`}>
                            {remainingVal || "—"}
                          </div>
                        ) : c.key === "purchaseDate" ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="h-9 w-full px-3 flex items-center justify-between text-sm rounded-md border border-transparent hover:border-input bg-transparent text-left"
                              >
                                <span className={row.purchaseDate ? "" : "text-muted-foreground"}>
                                  {row.purchaseDate ? formatPurchaseDate(row.purchaseDate) : "Select date"}
                                </span>
                                <CalendarIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={row.purchaseDate ? new Date(row.purchaseDate) : undefined}
                                onSelect={(d) => {
                                  if (d) updateCell(row.id, "purchaseDate", isoFromDate(d));
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input
                            type={c.type === "numeric" ? "text" : c.type || "text"}
                            inputMode={c.type === "numeric" ? "numeric" : undefined}
                            pattern={c.type === "numeric" ? "[0-9]*" : undefined}
                            value={row[c.key] as string}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (c.type === "numeric") v = v.replace(/[^0-9]/g, "");
                              updateCell(row.id, c.key, v);
                            }}
                            className="h-9 border-transparent focus:border-input bg-transparent"
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="text-right border-t border-border p-1">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveRow(row.id)}
                        disabled={!dirtyRows.has(row.id) || savingRows.has(row.id)}
                        aria-label="Save row"
                        title={dirtyRows.has(row.id) ? "Save changes" : "No changes"}
                      >
                        {savingRows.has(row.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : dirtyRows.has(row.id) ? (
                          <Save className="h-4 w-4 text-primary" />
                        ) : (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default AdminSheetDetail;
