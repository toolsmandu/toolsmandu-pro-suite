import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ProratedRefundTool = () => {
  const [fullAmount, setFullAmount] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [usedDays, setUsedDays] = useState('');

  const result = useMemo(() => {
    const amt = parseFloat(fullAmount);
    const total = parseInt(totalDays, 10);
    const used = parseInt(usedDays, 10);
    if (!amt || !total || used < 0) return null;
    if (used > total) return null;

    const remaining = total - used;
    const refund = (amt * remaining) / total;
    return {
      refund: Math.max(0, refund),
      total,
      used,
      remaining,
    };
  }, [fullAmount, totalDays, usedDays]);

  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-lg border border-border p-6 space-y-5" style={{ backgroundColor: '#0a2e5c' }}>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">1) Enter full amount paid</Label>
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
        <Label className="text-sm font-semibold">2) Total subscription period (days)</Label>
        <Input
          type="number"
          min="1"
          value={totalDays}
          onChange={(e) => setTotalDays(e.target.value)}
          placeholder="e.g. 365"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">3) Days already used</Label>
        <Input
          type="number"
          min="0"
          value={usedDays}
          onChange={(e) => setUsedDays(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>

      <div className="rounded-md border border-border p-4" style={{ backgroundColor: '#0a1e3d' }}>
        <div className="text-sm text-muted-foreground">The prorated refund amount is</div>
        <div className="text-3xl font-bold text-foreground mt-1">
          Rs{result ? fmtMoney(result.refund) : ' 0.00'}
        </div>
        {result && (
          <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
            <div>Total period: {result.total} days</div>
            <div>Days used: {result.used} days</div>
            <div>Days remaining: {result.remaining} days</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProratedRefundTool;
