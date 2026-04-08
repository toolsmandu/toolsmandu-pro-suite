import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';

const statusColors: Record<string, string> = {
  processing: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  // Fetch all non-admin notes for all user orders to determine which orders have admin messages
  const { data: allNotes } = useQuery({
    queryKey: ['my-all-order-notes'],
    queryFn: async () => {
      if (!orders?.length) return [];
      const orderIds = orders.map(o => o.id);
      const { data } = await supabase
        .from('order_notes')
        .select('*')
        .in('order_id', orderIds)
        .eq('is_admin_only', false)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!orders && orders.length > 0,
  });

  const getNotesForOrder = (orderId: string) => {
    if (!allNotes) return [];
    return allNotes.filter((n: any) => n.order_id === orderId);
  };

  const { data: orderNotes } = useQuery({
    queryKey: ['my-order-notes', selectedOrder?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', selectedOrder!.id)
        .eq('is_admin_only', false)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedOrder,
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

  const getProductLabel = (order: any) => {
    const items = (order.order_items as any[]) || [];
    if (!items.length) return 'N/A';
    const item = items[0];
    const name = item.products?.name || 'Product';
    return item.variation_name ? `${name} - ${item.variation_name}` : name;
  };

  if (isLoading) return <div className="text-muted-foreground">Loading orders...</div>;

  if (!orders?.length) return (
    <div className="text-center py-16">
      <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <p className="text-xl text-muted-foreground">No orders yet</p>
    </div>
  );

  const creds = selectedOrder ? getOrderCredentials(selectedOrder.id) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">My Orders</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => {
              const hasNotes = getNotesForOrder(order.id).length > 0;
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{(order as any).order_number || order.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{getProductLabel(order)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                  <TableCell className="font-semibold">NPR {order.total}</TableCell>
                  <TableCell><Badge className={statusColors[order.status]}>{capitalize(order.status)}</Badge></TableCell>
                  <TableCell>
                    {hasNotes ? (
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => setSelectedOrder(order)}>
                        View Admin's Message
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{(selectedOrder as any)?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="text-foreground">{getProductLabel(selectedOrder)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-semibold text-foreground">NPR {selectedOrder.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{formatDate(selectedOrder.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[selectedOrder.status]}>{capitalize(selectedOrder.status)}</Badge></div>
              </div>

              {/* Credentials */}
              {creds.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-primary mb-2">Your Credentials</p>
                  <div className="space-y-2">
                    {creds.map((a: any) => {
                      const cred = a.family_sharing_credentials;
                      const remaining = getRemainingDays(a);
                      return (
                        <div key={a.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => copyToClipboard(cred?.username || "")}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
                              {cred?.username} <Copy className="h-3 w-3" />
                            </button>
                            <button onClick={() => copyToClipboard(cred?.password || "")}
                              className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">
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

              {/* Order Notes */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-primary mb-2">Admin's Message</p>
                {orderNotes && orderNotes.length > 0 ? (
                  <div className="space-y-2">
                    {orderNotes.map((note: any) => (
                      <div key={note.id} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-sm text-foreground">{note.note}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDate(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No messages for this order.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
