import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ShoppingCart, Users, Newspaper } from 'lucide-react';

const AdminDashboard = () => {
  const { data: orderCounts } = useQuery({
    queryKey: ['admin-order-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('status');
      const counts = { processing: 0, completed: 0, cancelled: 0, refunded: 0, total: 0 };
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

  const stats = [
    { label: 'Total Products', value: productCount || 0, icon: Package, color: 'text-primary' },
    { label: 'Total Orders', value: orderCounts?.total || 0, icon: ShoppingCart, color: 'text-success' },
    { label: 'Total Customers', value: customerCount || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Blogs', value: blogCount || 0, icon: Newspaper, color: 'text-success' },
    { label: 'Processing', value: orderCounts?.processing || 0, icon: ShoppingCart, color: 'text-warning' },
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
    </div>
  );
};

export default AdminDashboard;
