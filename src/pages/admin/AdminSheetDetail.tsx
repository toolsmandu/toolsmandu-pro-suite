import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Check, Save, CalendarIcon, Eye, EyeOff, Search as SearchIcon, CalendarX2, Settings as SettingsIcon, Download } from "lucide-react";
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

type MasterRow = {
  id?: string;
  account: string;
  password: string;
  expiry_date: string;
  remarks: string;
};

const isRowEmpty = (r: Row) => !r.email && !r.phone;
const isMasterEmpty = (m: MasterRow) =>
  !m.account && !m.password && !m.expiry_date && !m.remarks;

const widthsKey = (id: string) => `admin_sheet_widths_${id}`;

const NORMAL_COLUMNS: { key: keyof Omit<Row, "id">; label: string; type?: string }[] = [
  { key: "orderId", label: "Order ID" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "period", label: "Period (days)", type: "numeric" },
  { key: "remaining", label: "Remaining" },
  { key: "remarks", label: "Remarks" },
];

const MASTER_COLUMNS: { key: keyof Omit<MasterRow, "id">; label: string; type?: string }[] = [
  { key: "account", label: "Family Manager Account" },
  { key: "password", label: "Password" },
  { key: "expiry_date", label: "Expiry Date", type: "date" },
  { key: "remarks", label: "Remarks" },
];

const DEFAULT_WIDTHS: Record<string, number> = {
  index: 70,
  orderId: 140,
  purchaseDate: 160,
  email: 220,
  phone: 150,
  period: 120,
  remaining: 120,
  remarks: 240,
  actions: 110,
  account: 240,
  password: 200,
  expiry_date: 160,
};

const emptyNormal = (): Row => ({
  id: crypto.randomUUID(),
  orderId: "",
  purchaseDate: "",
  email: "",
  phone: "",
  period: "",
  remaining: "",
  remarks: "",
});
const emptyMaster = (): MasterRow => ({ account: "", password: "", expiry_date: "", remarks: "" });

const AdminSheetDetail = () => {
  const { id = "" } = useParams();
  const location = useLocation();
  const isSimple = location.pathname.startsWith("/admin/sheets");
  const backPath = isSimple ? "/admin/sheets" : "/admin/family-sheets";
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // groups: each group has 2 master rows + 4 normal rows
  const [groups, setGroups] = useState<{ master: MasterRow[]; normal: Row[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGroups, setSavingGroups] = useState<Set<number>>(new Set());
  const [dirtyGroups, setDirtyGroups] = useState<Set<number>>(new Set());
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS);
  const showEmpty = true;
  const [search, setSearch] = useState("");
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [masterCount, setMasterCount] = useState(2);
  const [normalCount, setNormalCount] = useState(4);
  const [draftMasterCount, setDraftMasterCount] = useState(2);
  const [draftNormalCount, setDraftNormalCount] = useState(4);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const dragRef = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);
  const [sheetUuid, setSheetUuid] = useState<string>("");

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  // Load sheet + master rows
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const query = supabase.from("sheets").select("id, name, data, master_row_count, normal_row_count");
      const { data, error } = isUuid(id)
        ? await query.eq("id", id).maybeSingle()
        : await query.eq("slug", id).maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Failed to load sheet", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!data) { setLoading(false); return; }

      setSheet({ id: data.id, name: data.name });
      setSheetUuid(data.id);

      const mCount = (data as any).master_row_count ?? 2;
      const nCount = (data as any).normal_row_count ?? 4;
      setMasterCount(mCount);
      setNormalCount(nCount);
      setDraftMasterCount(mCount);
      setDraftNormalCount(nCount);


      // Parse normal rows from sheets.data (legacy: flat array of Row)
      const arr: any[] = Array.isArray(data.data) ? (data.data as any[]) : [];
      const normalRows: Row[] = arr
        .filter((r) => !r.kind || r.kind === "normal")
        .map((r) => ({
          id: r.id || crypto.randomUUID(),
          orderId: r.orderId || "",
          purchaseDate: r.purchaseDate || "",
          email: r.email || "",
          phone: r.phone || "",
          period: r.period || "",
          remaining: r.remaining || "",
          remarks: r.remarks || "",
        }));

      // Fetch master rows via edge function
      let masterByGroup: Record<number, MasterRow[]> = {};
      try {
        const { data: mres, error: merr } = await supabase.functions.invoke("sheet-master-rows", {
          body: { action: "list", sheet_id: data.id },
        });
        if (merr) throw merr;
        const rows = (mres?.rows || []) as any[];
        for (const r of rows) {
          if (!masterByGroup[r.group_index]) masterByGroup[r.group_index] = [];
          masterByGroup[r.group_index][r.row_index] = {
            id: r.id,
            account: r.account || "",
            password: r.password || "",
            expiry_date: r.expiry_date || "",
            remarks: r.remarks || "",
          };
        }
      } catch (e: any) {
        toast({ title: "Failed to load master rows", description: e?.message, variant: "destructive" });
      }

      const built: { master: MasterRow[]; normal: Row[] }[] = [];
      for (let i = 0; i < normalRows.length; i += nCount) {
        const gi = built.length;
        const m = masterByGroup[gi] || [];
        const masterArr: MasterRow[] = [];
        for (let r = 0; r < mCount; r++) masterArr.push(m[r] || emptyMaster());
        built.push({
          master: masterArr,
          normal: normalRows.slice(i, i + nCount).concat(
            Array.from({ length: Math.max(0, nCount - (normalRows.length - i)) }, () => emptyNormal())
          ),
        });
      }
      const maxMasterIdx = Math.max(-1, ...Object.keys(masterByGroup).map((k) => parseInt(k, 10)));
      while (built.length <= maxMasterIdx) {
        const gi = built.length;
        const m = masterByGroup[gi] || [];
        const masterArr: MasterRow[] = [];
        for (let r = 0; r < mCount; r++) masterArr.push(m[r] || emptyMaster());
        built.push({
          master: masterArr,
          normal: Array.from({ length: nCount }, () => emptyNormal()),
        });
      }
      setGroups(built);
      setDirtyGroups(new Set());

      try {
        const w = localStorage.getItem(widthsKey(id));
        setWidths({ ...DEFAULT_WIDTHS, ...(w ? JSON.parse(w) : {}) });
      } catch {}
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const persistNormalToDb = async (gs: typeof groups) => {
    const flatNormals = gs.flatMap((g) => g.normal);
    const { error } = await supabase
      .from("sheets")
      .update({ data: flatNormals as unknown as any, updated_at: new Date().toISOString() })
      .eq("id", sheetUuid || id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const markDirty = (gi: number) => setDirtyGroups((p) => { const n = new Set(p); n.add(gi); return n; });

  const updateNormal = (gi: number, rowId: string, key: keyof Row, value: string) => {
    setGroups((prev) => prev.map((g, i) => i !== gi ? g : {
      ...g,
      normal: g.normal.map((r) => r.id === rowId ? { ...r, [key]: value } : r),
    }));
    markDirty(gi);
  };

  const updateMaster = (gi: number, ri: number, key: keyof MasterRow, value: string) => {
    setGroups((prev) => prev.map((g, i) => {
      if (i !== gi) return g;
      const master = [...g.master];
      master[ri] = { ...master[ri], [key]: value };
      return { ...g, master };
    }));
    markDirty(gi);
  };

  const saveGroup = async (gi: number) => {
    setSavingGroups((p) => { const n = new Set(p); n.add(gi); return n; });
    try {
      const g = groupsRef.current[gi];
      // Save normals (whole sheet JSON)
      const ok = await persistNormalToDb(groupsRef.current);
      // Save master rows
      for (let ri = 0; ri < g.master.length; ri++) {
        const m = g.master[ri];
        const { error } = await supabase.functions.invoke("sheet-master-rows", {
          body: {
            action: "upsert",
            sheet_id: sheetUuid || id,
            group_index: gi,
            row_index: ri,
            account: m.account,
            password: m.password,
            expiry_date: m.expiry_date || null,
            remarks: m.remarks,
          },
        });
        if (error) throw error;
      }
      if (ok) {
        setDirtyGroups((p) => { const n = new Set(p); n.delete(gi); return n; });
        toast({ title: "Changes Saved" });
      }
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally {
      setSavingGroups((p) => { const n = new Set(p); n.delete(gi); return n; });
    }
  };

  const addRow = () => {
    setGroups((prev) => [
      ...prev,
      {
        master: Array.from({ length: isSimple ? 0 : masterCount }, () => emptyMaster()),
        normal: Array.from({ length: isSimple ? 1 : normalCount }, () => emptyNormal()),
      },
    ]);
    markDirty(groupsRef.current.length);
  };

  const deleteGroup = async (gi: number) => {
    if (!window.confirm("Delete this group and all its rows? This cannot be undone.")) return;
    const next = groupsRef.current.filter((_, i) => i !== gi);
    setGroups(next);
    setDirtyGroups((p) => { const n = new Set(p); n.delete(gi); return n; });
    await persistNormalToDb(next);
    try {
      await supabase.functions.invoke("sheet-master-rows", {
        body: { action: "delete_group", sheet_id: sheetUuid || id, group_index: gi },
      });
      // Reindex remaining master groups: easiest is to re-upsert all
      for (let i = 0; i < next.length; i++) {
        for (let ri = 0; ri < next[i].master.length; ri++) {
          const m = next[i].master[ri];
          await supabase.functions.invoke("sheet-master-rows", {
            body: {
              action: "upsert",
              sheet_id: sheetUuid || id,
              group_index: i,
              row_index: ri,
              account: m.account,
              password: m.password,
              expiry_date: m.expiry_date || null,
              remarks: m.remarks,
            },
          });
        }
      }
      // Delete trailing leftover index
      await supabase.functions.invoke("sheet-master-rows", {
        body: { action: "delete_group", sheet_id: sheetUuid || id, group_index: next.length },
      });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
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

  const normalCols = useMemo(
    () => {
      const base = NORMAL_COLUMNS.map((c) => ({ key: c.key as string, label: c.label }));
      return isSimple ? [...base, { key: "actions", label: "Action" }] : base;
    },
    [isSimple],
  );
  const masterCols = useMemo(
    () => [{ key: "index", label: "Index" }, ...MASTER_COLUMNS.map((c) => ({ key: c.key as string, label: c.label })), { key: "actions", label: "Action" }],
    [],
  );

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return groups
      .map((g, gi) => ({ g, gi }))
      .filter(({ g }) => {
        if (!showEmpty) {
          const anyMaster = g.master.some((m) => !!m.account);
          const anyNormal = g.normal.some((r) => !!(r.email || r.phone));
          if (!anyMaster && !anyNormal) return false;
        }
        if (showExpiredOnly) {
          const hasNegative = g.normal.some((r) => {
            const periodNum = parseInt(r.period, 10);
            if (!r.purchaseDate || isNaN(periodNum)) return false;
            const start = new Date(r.purchaseDate);
            if (isNaN(start.getTime())) return false;
            const expiry = new Date(start);
            expiry.setDate(expiry.getDate() + periodNum);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diff = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
            return diff < 0;
          });
          if (!hasNegative) return false;
        }
        if (!q) return true;
        const matchAccount = g.master.some((m) => (m.account || "").toLowerCase().includes(q));
        const matchEmail = g.normal.some((r) => (r.email || "").toLowerCase().includes(q));
        const matchPhone = digits.length >= 1 && g.normal.some((r) => {
          const last4 = (r.phone || "").replace(/\D/g, "").slice(-4);
          return last4 && last4.includes(digits.slice(-4));
        });
        return matchAccount || matchEmail || matchPhone;
      });
  }, [groups, showEmpty, search, showExpiredOnly]);

  const totalRows = groups.reduce((sum, g) => sum + g.master.length + g.normal.length, 0);

  // Apply size changes to existing groups (resize master/normal arrays)
  const applySizes = async (newMaster: number, newNormal: number) => {
    setSavingSettings(true);
    const { error } = await supabase
      .from("sheets")
      .update({ master_row_count: newMaster, normal_row_count: newNormal })
      .eq("id", sheetUuid || id);
    if (error) {
      setSavingSettings(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setGroups((prev) => prev.map((g) => {
      const master = [...g.master];
      while (master.length < newMaster) master.push(emptyMaster());
      while (master.length > newMaster) master.pop();
      const normal = [...g.normal];
      while (normal.length < newNormal) normal.push(emptyNormal());
      while (normal.length > newNormal) normal.pop();
      return { master, normal };
    }));
    setMasterCount(newMaster);
    setNormalCount(newNormal);
    setDirtyGroups(new Set(groupsRef.current.map((_, i) => i)));
    setSavingSettings(false);
    toast({ title: "Settings saved" });
  };

  const unsavedCount = dirtyGroups.size;

  const exportCSV = () => {
    const csvEscape = (v: string) => {
      const s = (v ?? "").toString();
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines: string[] = [];
    lines.push(["Index", "Section", ...MASTER_COLUMNS.map((c) => c.label), ...NORMAL_COLUMNS.map((c) => c.label)].map(csvEscape).join(","));
    groups.forEach((g, gi) => {
      g.master.forEach((m) => {
        const row = [
          String(gi + 1),
          "Family Manager",
          m.account,
          m.password,
          m.expiry_date ? formatPurchaseDate(m.expiry_date) : "",
          m.remarks,
          ...NORMAL_COLUMNS.map(() => ""),
        ];
        lines.push(row.map(csvEscape).join(","));
      });
      g.normal.forEach((r) => {
        let remaining = r.remaining;
        const periodNum = parseInt(r.period, 10);
        if (r.purchaseDate && !isNaN(periodNum)) {
          const start = new Date(r.purchaseDate);
          if (!isNaN(start.getTime())) {
            const expiry = new Date(start);
            expiry.setDate(expiry.getDate() + periodNum);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            remaining = String(Math.ceil((expiry.getTime() - today.getTime()) / 86400000));
          }
        }
        const row = [
          String(gi + 1),
          "Member",
          ...MASTER_COLUMNS.map(() => ""),
          r.orderId,
          r.purchaseDate ? formatPurchaseDate(r.purchaseDate) : "",
          r.email,
          r.phone,
          r.period,
          remaining,
          r.remarks,
        ];
        lines.push(row.map(csvEscape).join(","));
      });
    });
    const csv = lines.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (sheet?.name || "sheet").replace(/[^a-z0-9-_]+/gi, "_");
    a.href = url;
    a.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backPath} aria-label="Back to sheets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{sheet?.name || "Sheet"}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{groups.length} {groups.length === 1 ? "group" : "groups"} · {totalRows} rows</span>
              {unsavedCount > 0 && (
                <span className="text-xs text-warning">
                  {unsavedCount} unsaved {unsavedCount === 1 ? "group" : "groups"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account, email, phone (last 4)"
              className="pl-8 h-9 w-64"
            />
          </div>
          <Button
            variant={showExpiredOnly ? "default" : "outline"}
            onClick={() => setShowExpiredOnly((v) => !v)}
            disabled={loading}
          >
            <CalendarX2 className="h-4 w-4" />
            {showExpiredOnly ? "Show All Accounts" : "Show Expired Accounts"}
          </Button>
          <Button onClick={addRow} disabled={loading}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
          {!isSimple && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" disabled={loading} aria-label="Row settings" title="Row settings">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-3">
                <div className="font-semibold text-sm">Row Settings</div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Family Manager rows per group</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={draftMasterCount}
                    onChange={(e) => setDraftMasterCount(Math.max(1, Math.min(10, parseInt(e.target.value || "1", 10) || 1)))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Member rows per group</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={draftNormalCount}
                    onChange={(e) => setDraftNormalCount(Math.max(1, Math.min(50, parseInt(e.target.value || "1", 10) || 1)))}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => applySizes(draftMasterCount, draftNormalCount)}
                  disabled={savingSettings}
                >
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <p className="text-xs text-muted-foreground">
                  Settings are saved per sheet. Save each group afterwards to persist row data.
                </p>
              </div>
            </PopoverContent>

          </Popover>
          )}
          <Button variant="outline" onClick={exportCSV} disabled={loading} title="Export to CSV">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-muted/30 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-muted/30">
          {groups.length === 0
            ? 'No rows yet. Click "Add Row" to start.'
            : "All groups are empty. Toggle Show Empty Rows to view them."}
        </div>
      ) : isSimple ? (
        <div className="border border-border rounded-lg bg-muted/30 overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {normalCols.map((c: any) => (
                <col key={c.key} style={{ width: widths[c.key] }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-muted/60">
                {normalCols.map((c: any) => (
                  <th key={c.key} className="relative h-10 px-3 text-left align-middle font-medium text-muted-foreground border-r border-border last:border-r-0 select-none">
                    <span className="block truncate">{c.label}</span>
                    {c.key !== "actions" && (
                      <span onMouseDown={(e) => startResize(c.key, e)} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleGroups.flatMap(({ g, gi }) =>
                g.normal
                  .map((row: Row, idx: number) => ({ row, idx }))
                  .filter(({ row }) => showEmpty || !!(row.email || row.phone))
                  .map(({ row, idx }: { row: Row; idx: number }) => (
                    <SimpleRow
                      key={row.id}
                      row={row}
                      gi={gi}
                      idx={idx}
                      dirty={dirtyGroups.has(gi)}
                      saving={savingGroups.has(gi)}
                      onUpdateNormal={updateNormal}
                      onSave={() => saveGroup(gi)}
                      onDelete={() => deleteGroup(gi)}
                    />
                  ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map(({ g, gi }) => (
            <GroupBlock
              key={gi}
              gi={gi}
              group={g}
              widths={widths}
              startResize={startResize}
              normalCols={normalCols}
              masterCols={masterCols}
              showPassword={!!showPasswords[gi]}
              setShowPassword={(v) => setShowPasswords((p) => ({ ...p, [gi]: v }))}
              dirty={dirtyGroups.has(gi)}
              saving={savingGroups.has(gi)}
              showEmpty={showEmpty}
              onUpdateMaster={updateMaster}
              onUpdateNormal={updateNormal}
              onSave={() => saveGroup(gi)}
              onDelete={() => deleteGroup(gi)}
              isSimple={isSimple}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SimpleRow = ({ row, gi, idx, dirty, saving, onUpdateNormal, onSave, onDelete }: any) => {
  const periodNum = parseInt(row.period, 10);
  let remainingVal = "";
  let remainingClass = "";
  if (row.purchaseDate && !isNaN(periodNum)) {
    const start = new Date(row.purchaseDate);
    if (!isNaN(start.getTime())) {
      const expiry = new Date(start);
      expiry.setDate(expiry.getDate() + periodNum);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
      remainingVal = String(diff);
      remainingClass = diff < 0 ? "text-destructive-foreground font-semibold" : diff <= 7 ? "text-warning font-medium" : "";
    }
  }
  const isNegative = remainingVal !== "" && Number(remainingVal) < 0;
  return (
    <tr className={idx % 2 === 1 ? "bg-muted/40" : ""}>
      {NORMAL_COLUMNS.map((c) => {
        const isRemaining = c.key === "remaining";
        return (
          <td key={c.key} className={`p-1 align-top border-r border-border border-t ${isRemaining && isNegative ? "bg-destructive" : ""}`}>
            {isRemaining ? (
              <div className={`h-9 px-3 flex items-center text-sm ${remainingClass}`}>{remainingVal || "—"}</div>
            ) : c.key === "purchaseDate" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="h-9 w-full px-3 flex items-center justify-between text-sm rounded-md border border-input bg-background text-left">
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
                    onSelect={(d) => { if (d) onUpdateNormal(gi, row.id, "purchaseDate", isoFromDate(d)); }}
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
                  onUpdateNormal(gi, row.id, c.key, v);
                }}
                className="h-9 border-input bg-background"
              />
            )}
          </td>
        );
      })}
      <td className="border-t border-border p-1">
        <div className="flex items-center justify-end gap-1">
          {(dirty || saving) ? (
            <Button variant="ghost" size="icon" onClick={onSave} disabled={saving} aria-label="Save row" title="Save changes">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete row">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

const GroupBlock = ({
  gi, group, widths, startResize, normalCols, masterCols,
  showPassword, setShowPassword, dirty, saving, showEmpty, onUpdateMaster, onUpdateNormal, onSave, onDelete, isSimple,
}: any) => {
  let visibleMasterIndices = group.master.map((_: any, i: number) => i).filter((ri: number) => showEmpty || !!group.master[ri].account);
  const visibleNormal = group.normal
    .map((row: Row, idx: number) => ({ row, idx }))
    .filter(({ row }) => showEmpty || !!(row.email || row.phone));
  // Ensure the action buttons (save/delete) remain accessible: if all master rows are
  // hidden but normal rows are visible, force-show master row 0.
  if (!isSimple && visibleMasterIndices.length === 0 && visibleNormal.length > 0) {
    visibleMasterIndices = [0];
  }
  const firstActionIdx = visibleMasterIndices[0];
  if (!isSimple && visibleMasterIndices.length === 0 && visibleNormal.length === 0) return null;
  if (isSimple && visibleNormal.length === 0) return null;
  return (
    <div className="border border-border rounded-lg bg-muted/30 overflow-x-auto">
      {/* Master section */}
      {!isSimple && (
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {masterCols.map((c: any) => (
            <col key={c.key} style={{ width: widths[c.key] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-primary/15">
            {masterCols.map((c: any) => (
              <th key={c.key} className="relative h-10 px-3 text-left align-middle font-semibold text-foreground border-r border-border last:border-r-0 select-none">
                <span className="block truncate">{c.label}</span>
                <span onMouseDown={(e) => startResize(c.key, e)} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleMasterIndices.map((ri) => {
            const m = group.master[ri];
            return (
              <tr key={ri} className="bg-primary/5">
                {ri === firstActionIdx ? (
                  <td rowSpan={visibleMasterIndices.length} className="p-1 align-middle border-r border-border border-t text-center font-semibold text-foreground">
                    {gi + 1}
                  </td>
                ) : null}
                {MASTER_COLUMNS.map((c) => (
                  <td key={c.key} className="p-1 align-top border-r border-border border-t">
                    {c.key === "expiry_date" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="h-9 w-full px-3 flex items-center justify-between text-sm rounded-md border border-input bg-background text-left">
                            <span className={m.expiry_date ? "" : "text-muted-foreground"}>
                              {m.expiry_date ? formatPurchaseDate(m.expiry_date) : "Select date"}
                            </span>
                            <CalendarIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={m.expiry_date ? new Date(m.expiry_date) : undefined}
                            onSelect={(d) => { if (d) onUpdateMaster(gi, ri, "expiry_date", isoFromDate(d)); }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : c.key === "password" ? (
                      <div className="flex items-center gap-1">
                         <Input
                           type="text"
                           value={m.password}
                          onChange={(e) => onUpdateMaster(gi, ri, "password", e.target.value)}
                          className="h-9 border-input bg-background"
                        />
                        {ri === firstActionIdx && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Input
                        value={(m as any)[c.key] || ""}
                        onChange={(e) => onUpdateMaster(gi, ri, c.key as keyof MasterRow, e.target.value)}
                        className="h-9 border-input bg-background"
                      />
                    )}
                  </td>
                ))}
                <td className="text-right border-t border-border p-1">
                  {ri === firstActionIdx && (
                    <div className="flex items-center justify-end gap-1">
                      {(dirty || saving) ? (
                        <Button variant="ghost" size="icon" onClick={onSave} disabled={saving} aria-label="Save group" title="Save changes">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete group">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}

      {/* Normal section */}
      <table className="w-full text-sm border-t-2 border-border" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {normalCols.map((c: any) => (
            <col key={c.key} style={{ width: widths[c.key] }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-muted/60">
            {normalCols.map((c: any) => (
              <th key={c.key} className="relative h-10 px-3 text-left align-middle font-medium text-muted-foreground border-r border-border last:border-r-0 select-none">
                <span className="block truncate">{c.label}</span>
                <span onMouseDown={(e) => startResize(c.key, e)} className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleNormal.map(({ row, idx }: { row: Row; idx: number }) => (
            <tr key={row.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
              {NORMAL_COLUMNS.map((c) => {
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
                    remainingClass = diff < 0 ? "text-destructive-foreground font-semibold" : diff <= 7 ? "text-warning font-medium" : "";
                  }
                }
                const isNegative = isRemaining && remainingVal !== "" && Number(remainingVal) < 0;
                return (
                  <td key={c.key} className={`p-1 align-top border-r border-border border-t ${isNegative ? "bg-destructive" : ""}`}>
                    {isRemaining ? (
                      <div className={`h-9 px-3 flex items-center text-sm ${remainingClass}`}>{remainingVal || "—"}</div>
                    ) : c.key === "purchaseDate" ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="h-9 w-full px-3 flex items-center justify-between text-sm rounded-md border border-input bg-background text-left">
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
                            onSelect={(d) => { if (d) onUpdateNormal(gi, row.id, "purchaseDate", isoFromDate(d)); }}
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
                          onUpdateNormal(gi, row.id, c.key, v);
                        }}
                        className="h-9 border-input bg-background"
                      />
                    )}
                  </td>
                );
              })}
              
            </tr>
          ))}
        </tbody>
      </table>
      {isSimple && (
        <div className="flex items-center justify-end gap-1 p-2 border-t border-border bg-muted/40">
          {(dirty || saving) && (
            <Button variant="ghost" size="icon" onClick={onSave} disabled={!dirty || saving} aria-label="Save group" title="Save changes">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete row">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSheetDetail;
