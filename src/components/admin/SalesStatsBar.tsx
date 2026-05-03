import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const formatNPR = (n: number) =>
  `Rs ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const SalesStatsBar = () => {
  const { data } = useQuery({
    queryKey: ['admin-sales-stats'],
    queryFn: async () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const earliest = startOfLastMonth.toISOString();
      const { data: rows } = await supabase
        .from('orders')
        .select('total, refund_amount, completed_at, status')
        .eq('status', 'completed')
        .gte('completed_at', earliest);

      const sums = { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 };
      rows?.forEach((o: any) => {
        if (!o.completed_at) return;
        const d = new Date(o.completed_at);
        const net = Number(o.total || 0) - Number(o.refund_amount || 0);
        if (d >= startOfToday) sums.today += net;
        if (d >= startOfYesterday && d < startOfToday) sums.yesterday += net;
        if (d >= startOfThisMonth) sums.thisMonth += net;
        if (d >= startOfLastMonth && d < startOfThisMonth) sums.lastMonth += net;
      });
      return sums;
    },
    refetchInterval: 60_000,
  });

  const items = [
    { label: 'Today', value: data?.today || 0 },
    { label: 'Yesterday', value: data?.yesterday || 0 },
    { label: 'This Month', value: data?.thisMonth || 0 },
    { label: 'Last Month', value: data?.lastMonth || 0 },
  ];

  return (
    <div className="hidden md:flex items-center gap-2 overflow-x-auto whitespace-nowrap min-w-0">
      {items.map(i => (
        <div
          key={i.label}
          className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md border border-border bg-secondary text-[11px] sm:text-xs shrink-0"
        >
          <span className="text-muted-foreground">{i.label}:</span>
          <span className="font-semibold text-foreground">{formatNPR(i.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default SalesStatsBar;
