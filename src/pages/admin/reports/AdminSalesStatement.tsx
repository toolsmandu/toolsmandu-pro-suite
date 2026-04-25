import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/formatDate';

const TZ = 'Asia/Kathmandu';
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getKtmYearMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  return {
    year: Number(parts.find(p => p.type === 'year')!.value),
    month: Number(parts.find(p => p.type === 'month')!.value),
  };
};

const getKtmDateKey = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(iso));
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
};

const AdminSalesStatement = () => {
  const now = getKtmYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);

  // Range: first day of month -> first day of next month (in Kathmandu time)
  const { fromIso, toIso, daysInMonth } = useMemo(() => {
    const fromLocal = `${year}-${String(month).padStart(2, '0')}-01T00:00:00+05:45`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const toLocal = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+05:45`;
    const dim = new Date(Date.UTC(nextYear, nextMonth - 1, 1) - 1).getUTCDate();
    // simpler: compute days in selected month
    const realDim = new Date(year, month, 0).getDate();
    return {
      fromIso: new Date(fromLocal).toISOString(),
      toIso: new Date(toLocal).toISOString(),
      daysInMonth: realDim,
    };
  }, [year, month]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-statement', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, status, created_at')
        .gte('created_at', fromIso)
        .lt('created_at', toIso);
      if (error) throw error;
      return data || [];
    },
  });

  const rows = useMemo(() => {
    const todayKey = (() => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(new Date());
      const y = parts.find(p => p.type === 'year')!.value;
      const m = parts.find(p => p.type === 'month')!.value;
      const d = parts.find(p => p.type === 'day')!.value;
      return `${y}-${m}-${d}`;
    })();
    const map = new Map<string, { date: string; sales: number; refunds: number }>();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (key > todayKey) continue;
      map.set(key, { date: key, sales: 0, refunds: 0 });
    }
    (orders || []).forEach(o => {
      const key = getKtmDateKey(o.created_at);
      const row = map.get(key);
      if (!row) return;
      const total = Number(o.total) || 0;
      if (o.status === 'completed') row.sales += total;
      else if (o.status === 'refunded') row.refunds += total;
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, year, month, daysInMonth]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        sales: acc.sales + r.sales,
        refunds: acc.refunds + r.refunds,
        net: acc.net + (r.sales - r.refunds),
      }),
      { sales: 0, refunds: 0, net: 0 },
    );
  }, [rows]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = now.year; y >= now.year - 5; y--) arr.push(y);
    return arr;
  }, [now.year]);

  const fmt = (n: number) => `Rs ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Sales Statement</h2>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Month</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Refunds</TableHead>
              <TableHead className="text-right">Net Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (
              <>
                {rows.map(r => (
                  <TableRow key={r.date}>
                    <TableCell>{formatDate(r.date + 'T00:00:00+05:45')}</TableCell>
                    <TableCell className="text-right">{fmt(r.sales)}</TableCell>
                    <TableCell className="text-right">{fmt(r.refunds)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.sales - r.refunds)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{fmt(totals.sales)}</TableCell>
                  <TableCell className="text-right">{fmt(totals.refunds)}</TableCell>
                  <TableCell className="text-right">{fmt(totals.net)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSalesStatement;
