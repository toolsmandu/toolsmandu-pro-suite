import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import Package from 'lucide-react/dist/esm/icons/package.js';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import Newspaper from 'lucide-react/dist/esm/icons/newspaper.js';
import PauseCircle from 'lucide-react/dist/esm/icons/pause-circle.js';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw.js';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2.js';

const AdminDashboardCharts = lazy(() => import('./AdminDashboardCharts'));

const AdminDashboard = () => {
  const STALE = 60_000;
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowCharts(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const { data: orderCounts } = useQuery({
    queryKey: ['admin-order-counts'],
    staleTime: STALE,
    queryFn: async () => {
      const statuses = ['processing','on_hold','completed','cancelled','refunded','pending'] as const;
      const results = await Promise.all([
        ...statuses.map(s =>
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', s)
        ),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);
      const counts: any = { total: results[results.length - 1].count || 0 };
      statuses.forEach((s, i) => { counts[s] = results[i].count || 0; });
      return counts as { processing: number; on_hold: number; completed: number; cancelled: number; refunded: number; pending: number; total: number };
    },
  });

  const { data: productCount } = useQuery({
    queryKey: ['admin-product-count'],
    staleTime: STALE,
    queryFn: async () => {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: customerCount } = useQuery({
    queryKey: ['admin-customer-count'],
    staleTime: STALE,
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: blogCount } = useQuery({
    queryKey: ['admin-blog-count'],
    staleTime: STALE,
    queryFn: async () => {
      const { count } = await supabase.from('blogs').select('*', { count: 'exact', head: true });
      return count || 0;
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

      {showCharts && (
        <Suspense fallback={null}>
          <AdminDashboardCharts />
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
