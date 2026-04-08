import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';

const statusColors: Record<string, string> = {
  processing: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
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

  const { data: assignments } = useQuery({
    queryKey: ['my-credential-assignments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('credential_assignments')
        .select('id, assigned_at, credential_id, order_id, validity_days, family_sharing_credentials(username, password, twofa_link, family_product_id, family_sharing_products(login_link, products(name)))')
        .eq('user_id', user!.id);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const getOrderCredentials = (orderId: string) => {
    if (!assignments) return [];
    const now = new Date();
    return assignments.filter((a: any) => {
      if (a.order_id !== orderId) return false;
      const validity = a.validity_days;
      if (!validity) return true;
      const assignedDate = new Date(a.assigned_at);
      const expiryDate = new Date(assignedDate.getTime() + validity * 24 * 60 * 60 * 1000);
      return expiryDate > now;
    });
  };

  const getRemainingDays = (a: any) => {
    const validity = a.validity_days;
    if (!validity) return null;
    const assignedDate = new Date(a.assigned_at);
    const expiryDate = new Date(assignedDate.getTime() + validity * 24 * 60 * 60 * 1000);
    const remaining = Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return remaining > 0 ? remaining : 0;
  };

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
      {orders.map(order => {
        const creds = getOrderCredentials(order.id);
        return (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-muted-foreground">#{(order as any).order_number || order.id.slice(0, 8)}</CardTitle>
                <Badge className={statusColors[order.status]}>{order.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(order.order_items as any[])?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.products?.name || 'Product'}{item.variation_name ? ` - ${item.variation_name}` : ''}</span>
                    <span className="text-muted-foreground">NPR {item.price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-foreground">
                <span>Total</span><span>NPR {order.total}</span>
              </div>

              {/* Credentials */}
              {creds.length > 0 && (
                <div className="border-t border-border mt-3 pt-3">
                  <p className="text-xs font-semibold text-primary mb-2">Your Credentials</p>
                  <div className="space-y-2">
                    {creds.map((a: any) => {
                      const cred = a.family_sharing_credentials;
                      const remaining = getRemainingDays(a);
                      return (
                        <div key={a.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => copyToClipboard(cred?.username || "")}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
                            >
                              {cred?.username} <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(cred?.password || "")}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                            >
                              {cred?.password} <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            {remaining !== null ? (
                              <span className="text-yellow-400 font-semibold">{remaining} days remaining</span>
                            ) : (
                              <span className="text-muted-foreground">No expiry</span>
                            )}
                            <div className="flex gap-2">
                              {cred?.family_sharing_products?.login_link && (
                                <a href={cred.family_sharing_products.login_link} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-colors">
                                  Login <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {cred?.twofa_link && (
                                <a href={cred.twofa_link} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-colors">
                                  Get OTP <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OrdersPage;
