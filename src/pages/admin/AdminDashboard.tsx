import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [purging, setPurging] = useState(false);

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

  const handlePublishSEO = async () => {
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke('purge-cloudflare-cache', {
        method: 'POST',
      });
      if (data?.error) {
        const details = data.details ? `: ${JSON.stringify(data.details)}` : '';
        throw new Error(`${data.error}${details}`);
      }
      if (error) throw error;
      toast.success('CDN cache purged! Search engines will now see your latest changes.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to purge cache');
    } finally {
      setPurging(false);
    }
  };

  const stats = [
    { label: 'Total Products', value: productCount || 0, icon: Package, color: 'text-primary' },
    { label: 'Total Orders', value: orderCounts?.total || 0, icon: ShoppingCart, color: 'text-success' },
    { label: 'Processing', value: orderCounts?.processing || 0, icon: ShoppingCart, color: 'text-warning' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="flex items-center gap-3">
          <Button onClick={handlePublishSEO} disabled={purging} variant="outline" className="gap-2">
            {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publish SEO
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Purge CDN cache so search engines see your latest changes
          </span>
        </div>
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
