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
import { ChevronRight, Send, Save, Trash2, Plus } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  processing: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
};

interface EditItem {
  id: string;
  isNew?: boolean;
  product_id: string;
  variation_id: string;
  variation_name: string;
  price: number;
  quantity: number;
}

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editItems, setEditItems] = useState<EditItem[]>([]);
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

  const { data: products } = useQuery({
    queryKey: ['all-products-for-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, product_variations(id, name, price)')
        .order('name');
      return data || [];
    },
  });


  const updateOrder = useMutation({
    mutationFn: async ({ id, total, status, items, deletedItemIds }: { id: string; total: number; status: string; items: EditItem[]; deletedItemIds: string[] }) => {
      await supabase.from('orders').update({ total, status: status as any }).eq('id', id);

      if (deletedItemIds.length > 0) {
        await supabase.from('order_items').delete().in('id', deletedItemIds);
      }

      for (const item of items) {
        if (item.isNew) {
          await supabase.from('order_items').insert({
            order_id: id,
            product_id: item.product_id || null,
            variation_id: item.variation_id || null,
            variation_name: item.variation_name || null,
            price: item.price,
            quantity: item.quantity,
          });
        } else {
          await supabase.from('order_items').update({
            product_id: item.product_id || null,
            variation_id: item.variation_id || null,
            variation_name: item.variation_name || null,
            price: item.price,
            quantity: item.quantity,
          }).eq('id', item.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
      setSelectedOrder(null);
    },
  });

  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setEditTotal(String(order.total));
    setEditStatus(order.status);
    setDeletedItemIds([]);
    setEditItems(
      (order.order_items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id || '',
        variation_id: item.variation_id || '',
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
      deletedItemIds,
    });
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setEditItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    setEditItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        product_id: productId,
        variation_id: '',
        variation_name: '',
        price: product?.price || 0,
      } : item
    ));
  };

  const handleVariationChange = (index: number, variationId: string) => {
    const item = editItems[index];
    const product = products?.find((p: any) => p.id === item.product_id);
    const variation = (product as any)?.product_variations?.find((v: any) => v.id === variationId);
    if (variation) {
      setEditItems(prev => prev.map((it, i) =>
        i === index ? {
          ...it,
          variation_id: variationId,
          variation_name: variation.name,
          price: variation.price,
        } : it
      ));
    }
  };

  const addItem = () => {
    setEditItems(prev => [...prev, {
      id: crypto.randomUUID(),
      isNew: true,
      product_id: '',
      variation_id: '',
      variation_name: '',
      price: 0,
      quantity: 1,
    }]);
  };

  const removeItem = (index: number) => {
    const item = editItems[index];
    if (!item.isNew) {
      setDeletedItemIds(prev => [...prev, item.id]);
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const getVariationsForProduct = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    return (product as any)?.product_variations || [];
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || ''}`}>
                      {order.status}
                    </span>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
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
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">Products</Label>
                <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {editItems.map((item, index) => {
                  const variations = getVariationsForProduct(item.product_id);
                  return (
                    <div key={item.id} className="bg-muted/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Product</Label>
                            <Select value={item.product_id} onValueChange={(v) => handleProductChange(index, v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((p: any) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Variation</Label>
                            <Select
                              value={item.variation_id}
                              onValueChange={(v) => handleVariationChange(index, v)}
                              disabled={!variations.length}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={variations.length ? "Select variation" : "No variations"} />
                              </SelectTrigger>
                              <SelectContent>
                                {variations.map((v: any) => (
                                  <SelectItem key={v.id} value={v.id}>{v.name} — NPR {v.price}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 mt-4 text-destructive hover:text-destructive" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                          <Label className="text-[10px] text-muted-foreground">Quantity</Label>
                          <Input
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, 'quantity', parseInt(e.target.value) || 1)}
                            type="number"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
