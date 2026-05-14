import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STALE = 60_000;

const buildLast12Months = () => {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      label: `${MONTH_LABELS[start.getMonth()]} ${String(start.getFullYear()).slice(-2)}`,
      start, end,
    });
  }
  return months;
};

const AdminDashboardCharts = () => {
  const months = useMemo(buildLast12Months, []);
  const earliest = months[0].start.toISOString();

  const { data: signupChart } = useQuery({
    queryKey: ['admin-signups-active-12m'],
    staleTime: STALE,
    queryFn: async () => {
      const [signupsRes, loginsRes] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', earliest),
        supabase.from('customer_logins').select('user_id, logged_in_at').gte('logged_in_at', earliest),
      ]);
      const buckets = months.map(m => ({ month: m.label, signups: 0, active: 0 }));
      signupsRes.data?.forEach((row: any) => {
        const d = new Date(row.created_at);
        const idx = months.findIndex(m => d >= m.start && d < m.end);
        if (idx >= 0) buckets[idx].signups += 1;
      });
      const uniqueByMonth: Record<number, Set<string>> = {};
      loginsRes.data?.forEach((row: any) => {
        const d = new Date(row.logged_in_at);
        const idx = months.findIndex(m => d >= m.start && d < m.end);
        if (idx < 0) return;
        if (!uniqueByMonth[idx]) uniqueByMonth[idx] = new Set();
        uniqueByMonth[idx].add(row.user_id);
      });
      Object.entries(uniqueByMonth).forEach(([idx, set]) => {
        buckets[Number(idx)].active = set.size;
      });
      return buckets;
    },
  });

  const { data: orderChart } = useQuery({
    queryKey: ['admin-orders-12m'],
    staleTime: STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('status, completed_at, updated_at')
        .in('status', ['completed', 'refunded'])
        .gte('updated_at', earliest);
      const buckets = months.map(m => ({ month: m.label, completed: 0, refunded: 0 }));
      data?.forEach((row: any) => {
        const dateStr = row.completed_at || row.updated_at;
        if (!dateStr) return;
        const d = new Date(dateStr);
        const idx = months.findIndex(m => d >= m.start && d < m.end);
        if (idx < 0) return;
        if (row.status === 'completed') buckets[idx].completed += 1;
        else if (row.status === 'refunded') buckets[idx].refunded += 1;
      });
      return buckets;
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New Signups & Active Customers — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={signupChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <Legend />
              <Bar dataKey="signups" name="New Signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" name="Active Customers" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Orders Completed vs Refunded — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="refunded" name="Refunded" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;