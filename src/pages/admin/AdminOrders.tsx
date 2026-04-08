import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Send } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  processing: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [sending, setSending] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles(email, phone), order_items(*, products(name))')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('orders').update({ status: status as any }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status updated');
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, total, status }: { id: string; total: number; status: string }) => {
      await supabase.from('orders').update({ total, status: status as any }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
    },
  });

  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setEditTotal(String(order.total));
    setEditStatus(order.status);
    setOrderNote('');
  };

  const handleSaveOrder = () => {
    if (!selectedOrder) return;
    updateOrder.mutate({
      id: selectedOrder.id,
      total: parseFloat(editTotal) || selectedOrder.total,
      status: editStatus,
    });
  };

  const handleSendNote = async () => {
    if (!selectedOrder || !orderNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    const email = selectedOrder.profiles?.email;
    if (!email) {
      toast.error('Customer email not found');
      return;
    }
    setSending(true);
    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'order-note',
          recipientEmail: email,
          idempotencyKey: `order-note-${selectedOrder.id}-${Date.now()}`,
          templateData: {
            orderNumber: selectedOrder.order_number || selectedOrder.id.slice(0, 8),
            note: orderNote,
          },
        },
      });
      toast.success('Note sent to customer');
      setOrderNote('');
    } catch {
      toast.error('Failed to send note');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Orders</h2>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{order.order_number || order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-foreground">{order.profiles?.email || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{order.profiles?.phone || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.order_items
                      ?.map((i: any) => {
                        const name = i.products?.name || 'Product';
                        return i.variation_name ? `${name} - ${i.variation_name}` : name;
                      })
                      .filter(Boolean)
                      .join(', ')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">NPR {order.total}</TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['processing', 'completed', 'cancelled', 'refunded'].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openOrderDetail(order)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{selectedOrder?.profiles?.email || '-'}</span></p>
              <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder?.profiles?.phone || '-'}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}</span></p>
            </div>

            {/* Products */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Products</Label>
              <div className="space-y-1">
                {selectedOrder?.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.products?.name || 'Product'}{item.variation_name ? ` - ${item.variation_name}` : ''} × {item.quantity}
                    </span>
                    <span className="text-muted-foreground">NPR {item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-total" className="text-xs text-muted-foreground">Total (NPR)</Label>
                <Input id="edit-total" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} type="number" />
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-xs text-muted-foreground">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['processing', 'completed', 'cancelled', 'refunded'].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveOrder} className="w-full">Save Changes</Button>

            {/* Send Note */}
            <div className="border-t border-border pt-4">
              <Label htmlFor="order-note" className="text-xs text-muted-foreground mb-1 block">Send Note to Customer</Label>
              <Textarea
                id="order-note"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Type a note to send to the customer's email..."
                rows={3}
              />
              <Button onClick={handleSendNote} disabled={sending} className="mt-2 w-full" variant="secondary">
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Note via Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
