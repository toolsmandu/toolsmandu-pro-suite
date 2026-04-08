import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Send, Save } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { toast } from 'sonner';

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
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
    mutationFn: async ({ id, total, status, items }: { id: string; total: number; status: string; items: any[] }) => {
      await supabase.from('orders').update({ total, status: status as any }).eq('id', id);
      for (const item of items) {
        await supabase.from('order_items').update({
          variation_name: item.variation_name || null,
          price: item.price,
          quantity: item.quantity,
        }).eq('id', item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
      setSelectedOrder(null);
    },
  });

  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setEditTotal(String(order.total));
    setEditStatus(order.status);
    setEditItems(
      (order.order_items || []).map((item: any) => ({
        id: item.id,
        productName: item.products?.name || 'Product',
        variation_name: item.variation_name || '',
        price: item.price,
        quantity: item.quantity,
      }))
    );
    setOrderNote('');
  };

  const handleSaveOrder = () => {
    if (!selectedOrder) return;
    updateOrder.mutate({
      id: selectedOrder.id,
      total: parseFloat(editTotal) || selectedOrder.total,
      status: editStatus,
      items: editItems,
    });
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setEditItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
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
                    {formatDate(order.created_at)}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{selectedOrder?.profiles?.email || '-'}</span></p>
              <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder?.profiles?.phone || '-'}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{selectedOrder && formatDateTime(selectedOrder.created_at)}</span></p>
            </div>

            {/* Editable Products */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Products</Label>
              <div className="space-y-3">
                {editItems.map((item, index) => (
                  <div key={item.id} className="bg-muted/20 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">{item.productName}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Variation</Label>
                        <Input
                          value={item.variation_name}
                          onChange={(e) => updateItemField(index, 'variation_name', e.target.value)}
                          placeholder="Variation"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Price (NPR)</Label>
                        <Input
                          value={item.price}
                          onChange={(e) => updateItemField(index, 'price', parseFloat(e.target.value) || 0)}
                          type="number"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Qty</Label>
                        <Input
                          value={item.quantity}
                          onChange={(e) => updateItemField(index, 'quantity', parseInt(e.target.value) || 1)}
                          type="number"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Status */}
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
            <Button onClick={handleSaveOrder} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>

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
