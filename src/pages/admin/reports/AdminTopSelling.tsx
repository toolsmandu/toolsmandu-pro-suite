import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

const isoOfKtmDate = (y: number, m: number, d: number) =>
  new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+05:45`).toISOString();

const computeRange = (key: RangeKey, year: number, month: number): { from: string; to: string | null } => {
  const now = getKtmYearMonth();
  const today = new Date();
  // today in Kathmandu
  const ktmToday = (() => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(today);
    return {
      y: Number(parts.find(p => p.type === 'year')!.value),
      m: Number(parts.find(p => p.type === 'month')!.value),
      d: Number(parts.find(p => p.type === 'day')!.value),
    };
  })();

  const tomorrowIso = (() => {
    const d = new Date(`${ktmToday.y}-${String(ktmToday.m).padStart(2, '0')}-${String(ktmToday.d).padStart(2, '0')}T00:00:00+05:45`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
  })();

  const monthStartIso = (y: number, m: number) => isoOfKtmDate(y, m, 1);
  const nextMonthStartIso = (y: number, m: number) => {
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    return isoOfKtmDate(ny, nm, 1);
  };
  const minusMonths = (y: number, m: number, n: number) => {
    let total = y * 12 + (m - 1) - n;
    return { y: Math.floor(total / 12), m: (total % 12) + 1 };
  };
  const minusDaysIso = (n: number) => {
    const d = new Date(`${ktmToday.y}-${String(ktmToday.m).padStart(2, '0')}-${String(ktmToday.d).padStart(2, '0')}T00:00:00+05:45`);
    d.setUTCDate(d.getUTCDate() - n + 1);
    return d.toISOString();
  };

  switch (key) {
    case 'this_month':
      return { from: monthStartIso(now.year, now.month), to: tomorrowIso };
    case 'last_month': {
      const lm = minusMonths(now.year, now.month, 1);
      return { from: monthStartIso(lm.y, lm.m), to: monthStartIso(now.year, now.month) };
    }
    case 'last_7_days':
      return { from: minusDaysIso(7), to: tomorrowIso };
    case 'last_30_days':
      return { from: minusDaysIso(30), to: tomorrowIso };
    case 'last_3_months': {
      const s = minusMonths(now.year, now.month, 2);
      return { from: monthStartIso(s.y, s.m), to: tomorrowIso };
    }
    case 'last_6_months': {
      const s = minusMonths(now.year, now.month, 5);
      return { from: monthStartIso(s.y, s.m), to: tomorrowIso };
    }
    case 'last_12_months': {
      const s = minusMonths(now.year, now.month, 11);
      return { from: monthStartIso(s.y, s.m), to: tomorrowIso };
    }
    case 'lifetime':
      return { from: '1970-01-01T00:00:00.000Z', to: null };
    case 'custom_month':
      return { from: monthStartIso(year, month), to: nextMonthStartIso(year, month) };
  }
};

const AdminTopSelling = () => {
  const now = getKtmYearMonth();
  const [range, setRange] = useState<RangeKey>('this_month');
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [rowLimit, setRowLimit] = useState(25);

  const { from, to } = useMemo(() => computeRange(range, year, month), [range, year, month]);

  const { data: items, isLoading } = useQuery({
    queryKey: ['top-selling', from, to],
    queryFn: async () => {
      let orderQuery = supabase
        .from('orders')
        .select('id, status')
        .in('status', ['completed', 'refunded'])
        .gte('created_at', from);
      if (to) orderQuery = orderQuery.lt('created_at', to);
      const { data: orders, error: oErr } = await orderQuery;
      if (oErr) throw oErr;
      const orderIds = (orders || []).map(o => o.id);
      if (orderIds.length === 0) return [];

      // Supabase 1000 limit — page through order_items
      const all: any[] = [];
      const pageSize = 1000;
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('order_items')
          .select('product_id, variation_id, variation_name, price, quantity, order_id, products(name)')
          .in('order_id', orderIds)
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < pageSize) break;
        offset += pageSize;
      }
      return all;
    },
  });

  const rows = useMemo(() => {
    const map = new Map<string, { key: string; name: string; variation: string; quantity: number; revenue: number }>();
    (items || []).forEach((it: any) => {
      const key = `${it.product_id || 'na'}::${it.variation_id || 'na'}`;
      const name = it.products?.name || 'Unknown product';
      const variation = it.variation_name || '';
      const qty = Number(it.quantity) || 0;
      const rev = (Number(it.price) || 0) * qty;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += qty;
        existing.revenue += rev;
      } else {
        map.set(key, { key, name, variation, quantity: qty, revenue: rev });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, rowLimit);
  }, [items, rowLimit]);

  const totals = useMemo(() => rows.reduce(
    (acc, r) => ({ quantity: acc.quantity + r.quantity, revenue: acc.revenue + r.revenue }),
    { quantity: 0, revenue: 0 },
  ), [rows]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = now.year; y >= now.year - 5; y--) arr.push(y);
    return arr;
  }, [now.year]);

  const fmt = (n: number) => `Rs ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Top Selling</h2>

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
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead className="text-right">Quantity Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sales in this period.</TableCell></TableRow>
            ) : (
              <>
                {rows.map((r, i) => (
                  <TableRow key={r.key}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.variation || '—'}</TableCell>
                    <TableCell className="text-right">{r.quantity}</TableCell>
                    <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{totals.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(totals.revenue)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTopSelling;
