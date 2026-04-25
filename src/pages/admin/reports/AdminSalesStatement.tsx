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

type RangeKey =
  | 'this_month'
  | 'last_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'lifetime'
  | 'custom_month';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'custom_month', label: 'Custom Month/Year' },
];

const ROW_LIMITS = [25, 50, 75, 100];

const getKtmYearMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  return {
    year: Number(parts.find(p => p.type === 'year')!.value),
    month: Number(parts.find(p => p.type === 'month')!.value),
  };
};

const getKtmTodayParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  return {
    y: Number(parts.find(p => p.type === 'year')!.value),
    m: Number(parts.find(p => p.type === 'month')!.value),
    d: Number(parts.find(p => p.type === 'day')!.value),
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

const ktmDateIso = (y: number, m: number, d: number) =>
  new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+05:45`).toISOString();

const ktmDateKey = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const computeRange = (key: RangeKey, year: number, month: number) => {
  const now = getKtmYearMonth();
  const today = getKtmTodayParts();

  const monthStart = (y: number, m: number) => ({ y, m, d: 1 });
  const nextMonthStart = (y: number, m: number) => ({ y: m === 12 ? y + 1 : y, m: m === 12 ? 1 : m + 1, d: 1 });
  const minusMonths = (y: number, m: number, n: number) => {
    const total = y * 12 + (m - 1) - n;
    return { y: Math.floor(total / 12), m: (total % 12) + 1 };
  };
  const tomorrow = (() => {
    const d = new Date(`${today.y}-${String(today.m).padStart(2, '0')}-${String(today.d).padStart(2, '0')}T00:00:00+05:45`);
    d.setUTCDate(d.getUTCDate() + 1);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    return {
      y: Number(parts.find(p => p.type === 'year')!.value),
      m: Number(parts.find(p => p.type === 'month')!.value),
      d: Number(parts.find(p => p.type === 'day')!.value),
    };
  })();
  const minusDays = (n: number) => {
    const d = new Date(`${today.y}-${String(today.m).padStart(2, '0')}-${String(today.d).padStart(2, '0')}T00:00:00+05:45`);
    d.setUTCDate(d.getUTCDate() - n + 1);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    return {
      y: Number(parts.find(p => p.type === 'year')!.value),
      m: Number(parts.find(p => p.type === 'month')!.value),
      d: Number(parts.find(p => p.type === 'day')!.value),
    };
  };

  let from: { y: number; m: number; d: number };
  let to: { y: number; m: number; d: number } | null;

  switch (key) {
    case 'this_month':
      from = monthStart(now.year, now.month); to = tomorrow; break;
    case 'last_month': {
      const lm = minusMonths(now.year, now.month, 1);
      from = monthStart(lm.y, lm.m); to = monthStart(now.year, now.month); break;
    }
    case 'last_7_days':
      from = minusDays(7); to = tomorrow; break;
    case 'last_30_days':
      from = minusDays(30); to = tomorrow; break;
    case 'last_3_months': {
      const s = minusMonths(now.year, now.month, 2);
      from = monthStart(s.y, s.m); to = tomorrow; break;
    }
    case 'last_6_months': {
      const s = minusMonths(now.year, now.month, 5);
      from = monthStart(s.y, s.m); to = tomorrow; break;
    }
    case 'last_12_months': {
      const s = minusMonths(now.year, now.month, 11);
      from = monthStart(s.y, s.m); to = tomorrow; break;
    }
    case 'lifetime':
      from = { y: 2000, m: 1, d: 1 }; to = tomorrow; break;
    case 'custom_month':
      from = monthStart(year, month); to = nextMonthStart(year, month); break;
  }

  return {
    fromIso: ktmDateIso(from.y, from.m, from.d),
    toIso: to ? ktmDateIso(to.y, to.m, to.d) : null,
    fromKey: ktmDateKey(from.y, from.m, from.d),
    // exclusive upper bound key
    toKeyExclusive: to ? ktmDateKey(to.y, to.m, to.d) : null,
    todayKey: ktmDateKey(today.y, today.m, today.d),
  };
};

const AdminSalesStatement = () => {
  const now = getKtmYearMonth();
  const [range, setRange] = useState<RangeKey>('this_month');
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [rowLimit, setRowLimit] = useState(25);

  const { fromIso, toIso, fromKey, toKeyExclusive, todayKey } = useMemo(
    () => computeRange(range, year, month),
    [range, year, month],
  );

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-statement', fromIso, toIso],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('id, total, refund_amount, status, created_at')
        .gte('created_at', fromIso);
      if (toIso) q = q.lt('created_at', toIso);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const allRows = useMemo(() => {
    const map = new Map<string, { date: string; sales: number; refunds: number; salesCount: number; refundsCount: number }>();
    // Build day buckets from fromKey up to min(toKeyExclusive-1, todayKey)
    const start = new Date(fromKey + 'T00:00:00+05:45');
    const endExclusive = toKeyExclusive
      ? new Date(toKeyExclusive + 'T00:00:00+05:45')
      : new Date(todayKey + 'T00:00:00+05:45');
    // include up to today
    const cursor = new Date(start);
    while (cursor < endExclusive) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(cursor);
      const y = parts.find(p => p.type === 'year')!.value;
      const m = parts.find(p => p.type === 'month')!.value;
      const d = parts.find(p => p.type === 'day')!.value;
      const key = `${y}-${m}-${d}`;
      if (key <= todayKey) {
        map.set(key, { date: key, sales: 0, refunds: 0, salesCount: 0, refundsCount: 0 });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    (orders || []).forEach((o: any) => {
      const key = getKtmDateKey(o.created_at);
      const row = map.get(key);
      if (!row) return;
      const total = Number(o.total) || 0;
      if (o.status === 'completed' || o.status === 'refunded') {
        row.sales += total;
        row.salesCount += 1;
      }
      if (o.status === 'refunded') {
        const refunded = o.refund_amount != null ? Number(o.refund_amount) : total;
        row.refunds += refunded;
        row.refundsCount += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, fromKey, toKeyExclusive, todayKey]);

  const rows = useMemo(() => allRows.slice(0, rowLimit), [allRows, rowLimit]);

  const totals = useMemo(() => {
    return allRows.reduce(
      (acc, r) => ({
        sales: acc.sales + r.sales,
        refunds: acc.refunds + r.refunds,
        net: acc.net + (r.sales - r.refunds),
        salesCount: acc.salesCount + r.salesCount,
        refundsCount: acc.refundsCount + r.refundsCount,
      }),
      { sales: 0, refunds: 0, net: 0, salesCount: 0, refundsCount: 0 },
    );
  }, [allRows]);

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
          <Label className="text-xs text-muted-foreground mb-1 block">Date Range</Label>
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {range === 'custom_month' && (
          <>
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
          </>
        )}
        <div className="ml-auto">
          <Label className="text-xs text-muted-foreground mb-1 block">Show Rows</Label>
          <Select value={String(rowLimit)} onValueChange={(v) => setRowLimit(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROW_LIMITS.map(n => (
                <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
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
                    <TableCell className="text-right">{fmt(r.sales)} <span className="text-muted-foreground">({r.salesCount})</span></TableCell>
                    <TableCell className="text-right">{fmt(r.refunds)} <span className="text-muted-foreground">({r.refundsCount})</span></TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.sales - r.refunds)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total ({allRows.length} days)</TableCell>
                  <TableCell className="text-right">{fmt(totals.sales)} <span className="text-muted-foreground font-normal">({totals.salesCount})</span></TableCell>
                  <TableCell className="text-right">{fmt(totals.refunds)} <span className="text-muted-foreground font-normal">({totals.refundsCount})</span></TableCell>
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
