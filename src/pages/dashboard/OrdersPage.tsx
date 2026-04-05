import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

const statusColors: Record<string, string> = {
  processing: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const OrdersPage = () => {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, order_items(*, products(name, image_url))').eq('user_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="text-muted-foreground">Loading orders...</div>;

  if (!orders?.length) return (
    <div className="text-center py-16">
      <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-xl text-muted-foreground">No orders yet</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">My Orders</h2>
      {orders.map(order => (
        <Card key={order.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono text-muted-foreground">#{order.id.slice(0, 8)}</CardTitle>
              <Badge className={statusColors[order.status]}>{order.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(order.order_items as any[])?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.products?.name || 'Product'} × {item.quantity}</span>
                  <span className="text-muted-foreground">NPR {item.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-foreground">
              <span>Total</span><span>NPR {order.total}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrdersPage;
