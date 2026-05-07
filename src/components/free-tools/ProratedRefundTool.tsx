import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const toDate = (s: string) => {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const addYears = (d: Date, y: number) => {
  const n = new Date(d);
  n.setFullYear(n.getFullYear() + y);
  return n;
};
const addDays = (d: Date, days: number) => {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
};
const diffDays = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86400000);

const fmtDate = (d: Date) => {
  const y = d.getFullYear();
  const m = d.toLocaleString('en-US', { month: 'short' });
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${dd}`;
};


const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const ProratedRefundTool = () => {
  const [fullAmount, setFullAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [prorationDate, setProrationDate] = useState(todayStr());
  const [annual, setAnnual] = useState(true);
  const [endDate, setEndDate] = useState('');

  const result = useMemo(() => {
    const amt = parseFloat(fullAmount);
    const start = toDate(startDate);
    const proration = toDate(prorationDate);
    if (!amt || !start || !proration) return null;

    let end: Date | null;
    if (annual) {
      end = addDays(addYears(start, 1), -1);
    } else {
      end = toDate(endDate);
    }
    if (!end) return null;

    const fullTerm = diffDays(start, end);
    const prorationPeriod = diffDays(proration, end);
    if (fullTerm <= 0) return null;

    const refund = (amt * prorationPeriod) / fullTerm;
    return {
      refund: Math.max(0, refund),
      fullTerm,
      prorationPeriod: Math.max(0, prorationPeriod),
      end,
    };
  }, [fullAmount, startDate, prorationDate, annual, endDate]);

  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-lg border border-border p-6 space-y-5" style={{ backgroundColor: '#0a2e5c' }}>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">1) Enter full amount to prorate</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={fullAmount}
            onChange={(e) => setFullAmount(e.target.value)}
            className="pl-11"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">2) Service start date</Label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        {toDate(startDate) && (
          <div className="text-xs text-muted-foreground">{fmtDate(toDate(startDate)!)}</div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">3) Date of Partial refund Issue</Label>
        <Input
          type="date"
          value={prorationDate}
          onChange={(e) => setProrationDate(e.target.value)}
        />
        {toDate(prorationDate) && (
          <div className="text-xs text-muted-foreground">{fmtDate(toDate(prorationDate)!)}</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="annual"
            checked={annual}
            onCheckedChange={(c) => setAnnual(!!c)}
          />
          <Label htmlFor="annual" className="text-sm cursor-pointer">
            Annual subscription (adds 1 year to start date)
          </Label>
        </div>
        {!annual && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">4) Subscription end date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
      </div>

      <div className="rounded-md border border-border p-4" style={{ backgroundColor: '#0a1e3d' }}>
        <div className="text-sm text-muted-foreground">The prorated refund amount is</div>
        <div className="text-3xl font-bold text-foreground mt-1">
          Rs{result ? fmtMoney(result.refund) : ' 0.00'}
        </div>
        {result && (
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            <div>Full term: {result.fullTerm} days</div>
            <div>Remaining (refund) period: {result.prorationPeriod} days</div>
            <div>End date used: {fmtDate(result.end)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProratedRefundTool;
