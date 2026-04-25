import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, Newspaper, PauseCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const buildLast12Months = () => {
  const now = new Date();
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: `${MONTH_LABELS[start.getMonth()]} ${String(start.getFullYear()).slice(-2)}`,
      start, end,
    });
  }
  return months;
};

const AdminDashboard = () => {
  const { data: orderCounts } = useQuery({
    queryKey: ['admin-order-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('status');
      const counts = { processing: 0, on_hold: 0, completed: 0, cancelled: 0, refunded: 0, pending: 0, total: 0 };
      data?.forEach(o => { counts[o.status as keyof typeof counts]++; counts.total++; });
      return counts;
    },
  });

  const { data: productCount } = useQuery({
    queryKey: ['admin-product-count'],
    queryFn: async () => {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: customerCount } = useQuery({
    queryKey: ['admin-customer-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: blogCount } = useQuery({
    queryKey: ['admin-blog-count'],
    queryFn: async () => {
      const { count } = await supabase.from('blogs').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const months = buildLast12Months();
  const earliest = months[0].start.toISOString();

  const { data: signupChart } = useQuery({
    queryKey: ['admin-signups-active-12m'],
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
      // Unique active users per month
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

  const stats = [
    { label: 'Total Products', value: productCount || 0, icon: Package, color: 'text-primary' },
    { label: 'Total Orders', value: orderCounts?.total || 0, icon: ShoppingCart, color: 'text-success' },
    { label: 'Total Customers', value: customerCount || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Blogs', value: blogCount || 0, icon: Newspaper, color: 'text-success' },
    { label: 'Processing', value: orderCounts?.processing || 0, icon: ShoppingCart, color: 'text-warning' },
    { label: 'Hold', value: orderCounts?.on_hold || 0, icon: PauseCircle, color: 'text-warning' },
    { label: 'Refunded', value: orderCounts?.refunded || 0, icon: RotateCcw, color: 'text-destructive' },
    { label: 'Completed', value: orderCounts?.completed || 0, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border border-border shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-secondary ${color}`}><Icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
};

export default AdminDashboard;
