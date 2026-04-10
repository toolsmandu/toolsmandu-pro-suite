import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Save, Trash2, Plus, X, Search, Copy, Star, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, formatDateTime, formatRelativeDate, getKathmanduNowLocal, kathmanduToUTC } from '@/lib/formatDate';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-destructive/20 text-destructive',
  refunded: 'bg-red-500/20 text-red-400',
};

const selectClassName = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [sending, setSending] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Add order state
  const [addingOrder, setAddingOrder] = useState(false);
  const [newOrderDate, setNewOrderDate] = useState(getKathmanduNowLocal);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerError, setCustomerError] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newVariationId, setNewVariationId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);

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

  const { data: orderNotes } = useQuery({
    queryKey: ['order-notes', selectedOrder?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', selectedOrder!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, total, status, items, deletedItemIds, previousStatus, userId }: { id: string; total: number; status: string; items: EditItem[]; deletedItemIds: string[]; previousStatus: string; userId: string }) => {
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

      // Auto-assign credentials when status changes to completed
      if (status === 'completed' && previousStatus !== 'completed') {
        for (const item of items) {
          if (!item.variation_id) continue;
          const { data: links } = await supabase
            .from('credential_variant_links')
            .select('credential_id, priority')
            .eq('variant_id', item.variation_id)
            .order('priority');
          if (!links?.length) continue;

          for (const link of links) {
            const { data: existing } = await supabase
              .from('credential_assignments')
              .select('id')
              .eq('order_id', id)
              .eq('credential_id', link.credential_id)
              .eq('user_id', userId);
            if (existing && existing.length > 0) continue;

            const { data: cred } = await supabase
              .from('family_sharing_credentials')
              .select('assigned_count, max_limit')
              .eq('id', link.credential_id)
              .single();
            if (!cred || cred.assigned_count >= cred.max_limit) continue;

            const { data: variation } = await supabase
              .from('product_variations')
              .select('expiry_days')
              .eq('id', item.variation_id)
              .single();

            await supabase.from('credential_assignments').insert({
              credential_id: link.credential_id,
              order_id: id,
              user_id: userId,
              validity_days: variation?.expiry_days || null,
            });

            await supabase
              .from('family_sharing_credentials')
              .update({ assigned_count: (cred.assigned_count || 0) + 1 })
              .eq('id', link.credential_id);

            break;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

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
    setIsAdminOnly(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setSending(true);
    try {
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        total: parseFloat(editTotal) || selectedOrder.total,
        status: editStatus,
        items: editItems,
        deletedItemIds,
        previousStatus: selectedOrder.status,
        userId: selectedOrder.user_id,
      });

      if (orderNote.trim()) {
        await supabase.from('order_notes').insert({
          order_id: selectedOrder.id,
          note: orderNote.trim(),
          sent_by: user!.id,
          is_admin_only: isAdminOnly,
        } as any);
        queryClient.invalidateQueries({ queryKey: ['order-notes', selectedOrder.id] });
      }

      toast.success('Order updated');
      setSelectedOrder(null);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSending(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    setEditItems(prev => prev.map((item, i) =>
      i === index ? { ...item, product_id: productId, variation_id: '', variation_name: '', price: product?.price || 0 } : item
    ));
  };

  const handleVariationChange = (index: number, variationId: string) => {
    const item = editItems[index];
    const product = products?.find((p: any) => p.id === item.product_id);
    const variation = (product as any)?.product_variations?.find((v: any) => v.id === variationId);
    if (variation) {
      setEditItems(prev => prev.map((it, i) =>
        i === index ? { ...it, variation_id: variationId, variation_name: variation.name, price: variation.price } : it
      ));
    }
  };

  const addItem = () => {
    setEditItems(prev => [...prev, { id: crypto.randomUUID(), isNew: true, product_id: '', variation_id: '', variation_name: '', price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const item = editItems[index];
    if (!item.isNew) setDeletedItemIds(prev => [...prev, item.id]);
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const getVariationsForProduct = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    return (product as any)?.product_variations || [];
  };

  // Customer search for add order
  const handleCustomerSearch = async (term: string) => {
    setCustomerSearch(term);
    setSelectedCustomer(null);
    setCustomerError('');
    if (term.trim().length < 2) { setCustomerResults([]); return; }
    setCustomerSearching(true);
    const searchTerm = term.trim().toLowerCase();
    const { data } = await supabase.from('profiles').select('user_id, name, email, phone');
    const filtered = (data || []).filter(p =>
      p.email?.toLowerCase().includes(searchTerm) || p.phone?.toLowerCase().includes(searchTerm)
    );
    setCustomerResults(filtered);
    if (filtered.length === 0) setCustomerError('Not registered yet');
    setCustomerSearching(false);
  };

  const openAddOrder = () => {
    setSelectedOrder(null);
    setAddingOrder(true);
    setNewOrderDate(getKathmanduNowLocal());
    setCustomerSearch('');
    setCustomerResults([]);
    setSelectedCustomer(null);
    setCustomerError('');
    setNewProductId('');
    setNewVariationId('');
    setNewAmount('');
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer || !newProductId || !newAmount) return;
    setCreatingOrder(true);
    try {
      const product = products?.find((p: any) => p.id === newProductId);
      const variation = newVariationId ? (product as any)?.product_variations?.find((v: any) => v.id === newVariationId) : null;

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: selectedCustomer.user_id,
        total: parseFloat(newAmount),
        status: 'completed' as any,
        payment_status: 'paid',
        created_at: kathmanduToUTC(newOrderDate),
      }).select().single();
      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: newProductId,
        variation_id: newVariationId || null,
        variation_name: variation?.name || null,
        price: parseFloat(newAmount),
        quantity: 1,
      });
      if (itemError) throw itemError;

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order created successfully');
      setAddingOrder(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const newProductVariations = useMemo(() => {
    if (!newProductId) return [];
    const product = products?.find((p: any) => p.id === newProductId);
    return (product as any)?.product_variations || [];
  }, [newProductId, products]);

  // Compute each user's first order id
  const firstOrderMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!orders) return map;
    const sorted = [...orders].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const o of sorted) {
      if (!map[o.user_id]) map[o.user_id] = o.id;
    }
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order: any) => {
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const email = order.profiles?.email?.toLowerCase() || '';
        const phone = order.profiles?.phone?.toLowerCase() || '';
        const orderNum = (order.order_number || '').toLowerCase();
        if (!email.includes(term) && !phone.includes(term) && !orderNum.includes(term)) return false;
      }
      if (productFilter !== 'all') {
        const hasProduct = order.order_items?.some((i: any) => i.product_id === productFilter);
        if (!hasProduct) return false;
      }
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (dateFilter) {
        const orderDate = new Date(order.created_at);
        if (orderDate.toDateString() !== dateFilter.toDateString()) return false;
      }
      if (paymentFilter !== 'all') {
        const method = order.payment_pidx ? 'khalti' : 'manual';
        if (paymentFilter !== method) return false;
      }
      return true;
    });
  }, [orders, searchTerm, productFilter, statusFilter, dateFilter, paymentFilter]);

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Orders List */}
      <div className={`${(selectedOrder || addingOrder) ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <Button onClick={openAddOrder}><Plus className="h-4 w-4 mr-2" /> Add Order</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search email, phone, order ID" className="pl-9" />
          </div>
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className={selectClassName}>
            <option value="all">All Products</option>
            {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, 'PP') : 'Filter by date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={selectClassName}>
            <option value="all">All Payments</option>
            <option value="khalti">Khalti</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-14rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${selectedOrder?.id === order.id ? 'bg-muted/50' : ''}`}
                    onClick={() => openOrderDetail(order)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.order_number || order.id.slice(0, 8)}
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
                      {formatRelativeDate(order.created_at)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">NPR {order.total}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.payment_pidx ? 'Khalti' : 'Manual'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {selectedOrder && (
        <div className="w-full lg:w-[480px] lg:min-w-[480px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Edit Order {selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Customer Information */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Customer Information</Label>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{formatDateTime(selectedOrder.created_at)}</span></p>
                  <p><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{selectedOrder?.profiles?.email || '-'}</span></p>
                  <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder?.profiles?.phone || '-'}</span></p>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Payment Information</Label>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Payment Method:</span> <span className="text-foreground">{selectedOrder?.payment_pidx ? 'Khalti' : 'N/A'}</span></p>
                  <p><span className="text-muted-foreground">Total Amount:</span> <span className="font-semibold text-foreground">NPR {selectedOrder?.total}</span></p>
                  <p>
                    <span className="text-muted-foreground">Payment Status:</span>{' '}
                    {selectedOrder?.payment_status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">Success</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                        {selectedOrder?.payment_status === 'failed' ? 'Failed' : selectedOrder?.payment_status === 'expired' ? 'Failed' : 'Cancelled'}
                      </span>
                    )}
                  </p>
                </div>
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
                      <div key={item.id} className="bg-muted/20 rounded-lg p-2">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Product</Label>
                            <Select value={item.product_id} onValueChange={(v) => handleProductChange(index, v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                              <SelectContent>
                                {products?.map((p: any) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Variation</Label>
                            <Select value={item.variation_id} onValueChange={(v) => handleVariationChange(index, v)} disabled={!variations.length}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={variations.length ? "Select variation" : "No variations"} /></SelectTrigger>
                              <SelectContent>
                                {variations.map((v: any) => (
                                  <SelectItem key={v.id} value={v.id}>{v.name} — NPR {v.price}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeItem(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
                      {['pending', 'processing', 'completed', 'cancelled', 'refunded'].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Note */}
              <div className="border-t border-border pt-4">
                <Label htmlFor="order-note" className="text-xs text-muted-foreground mb-1 block">Customer Note (optional)</Label>
                <Textarea
                  id="order-note"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Type a note to send to the customer..."
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox id="admin-only" checked={isAdminOnly} onCheckedChange={(v) => setIsAdminOnly(!!v)} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="admin-only" className="text-xs text-muted-foreground cursor-pointer">Admin only (not visible to customer)</Label>
                </div>
              </div>

              <Button onClick={handleUpdateOrder} disabled={sending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {sending ? 'Updating...' : 'Update Order'}
              </Button>

              {/* Sent Notes History */}
              {orderNotes && orderNotes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground block">Sent Notes</Label>
                  {orderNotes.map((n: any) => (
                    <div key={n.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground whitespace-pre-wrap flex-1">{n.note}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(n.note); toast.success('Copied to clipboard'); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        {n.is_admin_only && <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-medium shrink-0">Admin Only</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add Order Panel */}
      {addingOrder && (
        <div className="w-full lg:w-[480px] lg:min-w-[480px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Add Order</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddingOrder(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Order Date */}
              <div>
                <Label>Order Date</Label>
                <Input type="datetime-local" value={newOrderDate} onChange={e => setNewOrderDate(e.target.value)} className="border-foreground" />
              </div>

              {/* Customer Search */}
              <div>
                <Label>Customer</Label>
                <Input
                  placeholder="Search by email or phone..."
                  value={customerSearch}
                  onChange={e => handleCustomerSearch(e.target.value)}
                  className="border-foreground"
                />
                {customerSearching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
                {customerError && <p className="text-xs text-destructive mt-1">{customerError}</p>}
                {customerResults.length > 0 && !selectedCustomer && (
                  <div className="border border-border rounded-md mt-1 max-h-40 overflow-y-auto">
                    {customerResults.map(c => (
                      <button
                        key={c.user_id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch(c.email || c.phone || '');
                          setCustomerResults([]);
                          setCustomerError('');
                        }}
                      >
                        <span className="text-foreground">{c.name || c.email}</span>
                        <span className="text-xs text-muted-foreground">{c.email} · {c.phone || 'No phone'}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="bg-muted/30 rounded-lg p-2 mt-1 text-sm flex items-center justify-between">
                    <div>
                      <p className="text-foreground">{selectedCustomer.name || selectedCustomer.email}</p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.email} · {selectedCustomer.phone || 'No phone'}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div>
                <Label>Product</Label>
                <select
                  value={newProductId}
                  onChange={e => { setNewProductId(e.target.value); setNewVariationId(''); }}
                  className={selectClassName.replace('border-input', 'border-foreground')}
                >
                  <option value="">Select a product</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Variation Selection */}
              {newProductVariations.length > 0 && (
                <div>
                  <Label>Variation</Label>
                  <select
                    value={newVariationId}
                    onChange={e => setNewVariationId(e.target.value)}
                    className={selectClassName.replace('border-input', 'border-foreground')}
                  >
                    <option value="">Select a variation</option>
                    {newProductVariations.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name} — NPR {v.price}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <Label>Amount (NPR)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="border-foreground"
                />
              </div>

              {/* Create Button */}
              <Button
                className="w-full"
                onClick={handleCreateOrder}
                disabled={creatingOrder || !selectedCustomer || !newProductId || !newAmount}
              >
                {creatingOrder ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
