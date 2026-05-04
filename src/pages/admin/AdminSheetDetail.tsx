import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Sheet = { id: string; name: string };

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
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // Load sheet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sheets")
        .select("id, name, data")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Failed to load sheet", description: error.message, variant: "destructive" });
      } else if (data) {
        setSheet({ id: data.id, name: data.name });
        const arr = Array.isArray(data.data) ? (data.data as unknown as Row[]) : [];
        setRows(arr.map((r) => ({ ...r, id: r.id || crypto.randomUUID() })));
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

  // Debounced autosave
  const scheduleSave = (next: Row[]) => {
    dirtyRef.current = true;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase
        .from("sheets")
        .update({ data: next as unknown as any, updated_at: new Date().toISOString() })
        .eq("id", id);
      setSaving(false);
      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      } else {
        dirtyRef.current = false;
        setSavedAt(Date.now());
      }
    }, 600);
  };

  const persistRows = (next: Row[]) => {
    setRows(next);
    scheduleSave(next);
  };

  const updateCell = (rowId: string, key: keyof Row, value: string) => {
    persistRows(rows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
  };

  const addRow = () => persistRows([...rows, emptyRow()]);
  const deleteRow = (rowId: string) => persistRows(rows.filter((r) => r.id !== rowId));

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

  const statusLabel = saving ? "Saving..." : savedAt ? "Saved" : "";

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
              {statusLabel && (
                <span className="flex items-center gap-1 text-xs">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  {statusLabel}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={addRow} disabled={loading}>
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
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
      )}
    </div>
  );
};

export default AdminSheetDetail;
