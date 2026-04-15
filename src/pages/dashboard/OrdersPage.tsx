import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Copy, ExternalLink, User, KeyRound, RotateCcwKey, Link2, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';

const statusColors: Record<string, string> = {
  pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  processing: 'bg-warning/20 text-warning border-warning/30',
  on_hold: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
  refunded: 'bg-muted text-muted-foreground border-border',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ALL_STATUSES = ['completed', 'expired', 'on_hold', 'refunded', 'pending', 'cancelled'];
const DEFAULT_STATUSES = ['completed', 'on_hold', 'expired'];

const capitalize = (s: string) => s === 'on_hold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1);

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

const OrdersPage = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(DEFAULT_STATUSES);

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
      // Cleanup expired assignments first (frees credential slots)
      await supabase.rpc('cleanup_expired_assignments');

      const { data } = await supabase
        .from('credential_assignments')
        .select('id, assigned_at, credential_id, order_id, validity_days, family_sharing_credentials(username, password, twofa_link, family_product_id, family_sharing_products(login_link, products(name)))')
        .eq('user_id', user!.id);
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // Fetch family-sharing linked variant IDs to detect expired orders
  const { data: fsVariantIds } = useQuery({
    queryKey: ['fs-variant-ids'],
    queryFn: async () => {
      const { data } = await supabase.from('credential_variant_links').select('variant_id');
      return (data || []).map((d: any) => d.variant_id);
    },
  });

  const isOrderExpired = (order: any) => {
    if (order.status !== 'completed') return false;
    if (!fsVariantIds?.length) return false;
    const items = (order.order_items as any[]) || [];
    const hasFsItem = items.some((i: any) => i.variation_id && fsVariantIds.includes(i.variation_id));
    if (!hasFsItem) return false;
    // Has family sharing items but no active assignments
    const activeCreds = getOrderCredentials(order.id);
    return activeCreds.length === 0;
  };

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
    const now = Date.now();
    return assignments.filter((a: any) => {
      if (a.order_id !== orderId) return false;
      const validity = a.validity_days;
      if (!validity) return true;
      const assignedDate = new Date(a.assigned_at);
      const expiryMs = assignedDate.getTime() + validity * 24 * 60 * 60 * 1000;
      const remainingDays = Math.ceil((expiryMs - now) / (24 * 60 * 60 * 1000));
      return remainingDays > 0;
    });
  };

  const getRemainingTime = (a: any) => {
    const validity = a.validity_days;
    if (!validity) return null;
    const assignedDate = new Date(a.assigned_at);
    const expiryDate = new Date(assignedDate.getTime() + validity * 24 * 60 * 60 * 1000);
    const remainingMs = expiryDate.getTime() - Date.now();
    if (remainingMs <= 0) return { value: 0, unit: 'days' as const };
    return { value: Math.ceil(remainingMs / (24 * 60 * 60 * 1000)), unit: 'days' as const };
  };

  // Re-render every hour to update remaining time
  const [, setTick] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getProductLabel = (order: any) => {
    const items = (order.order_items as any[]) || [];
    if (!items.length) return 'N/A';
    const item = items[0];
    const name = item.products?.name || 'Product';
    return item.variation_name ? `${name} - ${item.variation_name}` : name;
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const expired = isOrderExpired(order);
      const displayStatus = expired ? 'expired' : order.status;
      return statusFilter.includes(displayStatus);
    });
  }, [orders, statusFilter, fsVariantIds, assignments]);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">My Orders</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter.join(',')} onValueChange={(val) => setStatusFilter(val === 'all' ? ALL_STATUSES : [val])}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{capitalize(s === 'on_hold' ? 'On Hold' : s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusFilter.length !== DEFAULT_STATUSES.length || !DEFAULT_STATUSES.every(s => statusFilter.includes(s)) ? (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setStatusFilter(DEFAULT_STATUSES)}>Reset</Button>
          ) : null}
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Order ID</TableHead>
              <TableHead className="text-center">Product</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Amount</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders match the selected filter.</TableCell></TableRow>
            ) : null}
            {filteredOrders.map(order => {
              const hasNotes = getNotesForOrder(order.id).length > 0;
              const orderCreds = getOrderCredentials(order.id);
              const expired = isOrderExpired(order);
              const displayStatus = expired ? 'expired' : order.status;
              return (
                <React.Fragment key={order.id}>
                  <TableRow className={orderCreds.length > 0 ? "border-b-0" : ""}>
                    <TableCell className="text-sm text-center">{(order as any).order_number || order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-center">{getProductLabel(order)}</TableCell>
                    <TableCell className="text-sm text-center">{formatDate(order.created_at)}</TableCell>
                    <TableCell className="font-semibold text-center">NPR {order.total}</TableCell>
                    <TableCell className="text-sm text-center">{(order as any).payment_pidx ? 'Khalti' : 'Manual'}</TableCell>
                    <TableCell className="text-center"><Badge className={statusColors[displayStatus] || statusColors[order.status]}>{capitalize(displayStatus)}</Badge></TableCell>
                    <TableCell className="text-center">
                      {hasNotes ? (
                        <Badge
                          className="bg-success text-white border-success/30 cursor-pointer hover:bg-success/80 transition-colors"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Admin's Message
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {orderCreds.length > 0 && (
                    <TableRow className="hover:bg-transparent border-b border-border border-t-0">
                      <TableCell colSpan={7} className="p-2">
                        <div className="space-y-2">
                          {orderCreds.map((a: any) => {
                            const cred = a.family_sharing_credentials;
                            const remaining = getRemainingTime(a);
                            return (
                              <div key={a.id} className="bg-muted/30 rounded-lg px-6 py-4 overflow-x-auto">
                              <div className="flex items-center justify-evenly gap-4 flex-nowrap min-w-max lg:min-w-0 lg:flex-wrap">
                                  <button onClick={() => copyToClipboard(cred?.username || "")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">
                                    <User className="h-3 w-3" /> Username: {cred?.username} <Copy className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => copyToClipboard(cred?.password || "")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors">
                                    <KeyRound className="h-3 w-3" /> Password: {cred?.password} <Copy className="h-3 w-3" />
                                  </button>
                                  {cred?.twofa_link && (
                                    <a href={cred.twofa_link} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-colors">
                                      <RotateCcwKey className="h-3 w-3" /> Get OTP Code
                                    </a>
                                  )}
                                  {cred?.family_sharing_products?.login_link && (
                                    <a href={cred.family_sharing_products.login_link} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors">
                                      <Link2 className="h-3 w-3" /> Login Link
                                    </a>
                                  )}
                                  {remaining !== null ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-white text-xs font-semibold">
                                      <Clock className="h-3 w-3" /> Remaining: {remaining.value} Days
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No expiry</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {(selectedOrder as any)?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="text-foreground">{getProductLabel(selectedOrder)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">NPR {selectedOrder.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{formatDate(selectedOrder.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={statusColors[selectedOrder.status]}>{capitalize(selectedOrder.status)}</Badge></div>
              </div>


              {/* Order Notes */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-success mb-2">Admin's Message</p>
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
