import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarIcon, X, Save, Search, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CouponForm {
  code: string;
  expiry_date: Date | undefined;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_uses_per_customer: string;
  total_quantity: string;
  coupon_scope: 'all_customers' | 'specific_customer';
  customer_email: string;
  product_scope: 'all_products' | 'specific_product';
  product_id: string;
  variation_id: string;
  min_cart_value: string;
  max_discount_amount: string;
  is_active: boolean;
}

const emptyForm = (): CouponForm => ({
  code: '', expiry_date: undefined, discount_type: 'percentage', discount_value: '',
  max_uses_per_customer: '1', total_quantity: '1', coupon_scope: 'all_customers',
  customer_email: '', product_scope: 'all_products', product_id: '', variation_id: '',
  min_cart_value: '', max_discount_amount: '', is_active: true,
});

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: variations } = useQuery({
    queryKey: ['variations-for-product', form.product_id],
    queryFn: async () => {
      if (!form.product_id) return [];
      const { data } = await supabase.from('product_variations').select('id, name').eq('product_id', form.product_id).order('sort_order');
      return data || [];
    },
    enabled: !!form.product_id,
  });

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setPanelOpen(true);
  };

  const openEdit = (coupon: any) => {
    setForm({
      code: coupon.code,
      expiry_date: new Date(coupon.expiry_date),
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      max_uses_per_customer: String(coupon.max_uses_per_customer),
      total_quantity: String(coupon.total_quantity),
      coupon_scope: coupon.coupon_scope,
      customer_email: coupon.customer_email || '',
      product_scope: coupon.product_scope,
      product_id: coupon.product_id || '',
      variation_id: coupon.variation_id || '',
      min_cart_value: coupon.min_cart_value ? String(coupon.min_cart_value) : '',
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
      is_active: coupon.is_active,
    });
    setEditingId(coupon.id);
    setPanelOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code || !form.expiry_date || !form.discount_value) throw new Error('Fill required fields');
      const payload: any = {
        code: form.code.toUpperCase().trim(),
        expiry_date: form.expiry_date.toISOString(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses_per_customer: parseInt(form.max_uses_per_customer) || 1,
        total_quantity: parseInt(form.total_quantity) || 1,
        coupon_scope: form.coupon_scope,
        customer_email: form.coupon_scope === 'specific_customer' ? form.customer_email : null,
        product_scope: form.product_scope,
        product_id: form.product_scope === 'specific_product' ? form.product_id || null : null,
        variation_id: form.product_scope === 'specific_product' ? form.variation_id || null : null,
        min_cart_value: form.min_cart_value ? parseFloat(form.min_cart_value) : 0,
        max_discount_amount: form.discount_type === 'percentage' && form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(editingId ? 'Coupon updated!' : 'Coupon created!');
      setPanelOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('coupons').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Coupon deleted'); },
  });

  const isExpired = (d: string) => new Date(d) < new Date();

  return (
    <div className={`flex gap-6 h-[calc(100vh-5rem)] ${panelOpen ? 'lg:flex-row-reverse' : ''}`}>
      {/* Coupons List */}
      <div className={`${panelOpen ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Coupons</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search coupons" className="pl-9 w-56" />
            </div>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Coupon</Button>
          </div>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Discount</TableHead>
                  <TableHead>Expiry</TableHead><TableHead>Customer Scope</TableHead><TableHead>Product Scope</TableHead>
                  <TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.filter(c => {
                  const term = searchTerm.trim().toLowerCase();
                  if (!term) return true;
                  return c.code.toLowerCase().includes(term) || c.customer_email?.toLowerCase().includes(term);
                }).map(c => (
                  <TableRow key={c.id} className={`cursor-pointer ${editingId === c.id && panelOpen ? 'bg-muted/50' : ''}`} onClick={() => openEdit(c)}>
                    <TableCell className="font-mono font-medium text-foreground">{c.code}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{c.discount_type}</TableCell>
                    <TableCell className="text-foreground">{c.discount_type === 'percentage' ? `${c.discount_value}%` : `NPR ${c.discount_value}`}</TableCell>
                    <TableCell className={isExpired(c.expiry_date) ? 'text-destructive' : 'text-muted-foreground'}>{format(new Date(c.expiry_date), 'PP')}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.coupon_scope === 'all_customers' ? 'All' : 'Limited'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.product_scope === 'all_products' ? 'All' : 'Limited'}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${c.is_active && !isExpired(c.expiry_date) ? 'text-success' : 'text-destructive'}`}>
                        {!c.is_active ? 'Inactive' : isExpired(c.expiry_date) ? 'Expired' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons?.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No coupons yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit/Add Panel */}
      {panelOpen && (
        <div className="w-full lg:w-[480px] lg:min-w-[480px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{editingId ? 'Edit Coupon' : 'Add Coupon'}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Coupon Code *</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" className="font-mono" />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Expiry Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.expiry_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.expiry_date ? format(form.expiry_date, 'PPP') : 'Pick expiry date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={form.expiry_date} onSelect={d => setForm({ ...form, expiry_date: d })} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Coupon Type *</Label>
                  <Select value={form.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" className="z-[9999]">
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{form.discount_type === 'percentage' ? 'Discount %' : 'Amount (NPR)'} *</Label>
                  <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 100'} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Max uses / customer</Label>
                  <Input type="number" value={form.max_uses_per_customer} onChange={e => setForm({ ...form, max_uses_per_customer: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total coupons</Label>
                  <Input type="number" value={form.total_quantity} onChange={e => setForm({ ...form, total_quantity: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Coupon For</Label>
                <Select value={form.coupon_scope} onValueChange={(v: 'all_customers' | 'specific_customer') => setForm({ ...form, coupon_scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="all_customers">For All Customers</SelectItem>
                    <SelectItem value="specific_customer">For Specific Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.coupon_scope === 'specific_customer' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Customer Email *</Label>
                  <Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} placeholder="customer@email.com" />
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Product Specific?</Label>
                <Select value={form.product_scope} onValueChange={(v: 'all_products' | 'specific_product') => setForm({ ...form, product_scope: v, product_id: '', variation_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="all_products">For All Products</SelectItem>
                    <SelectItem value="specific_product">For Specific Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.product_scope === 'specific_product' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Product *</Label>
                    <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v, variation_id: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent position="popper" className="z-[9999]">
                        {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Variation</Label>
                    <Select value={form.variation_id} onValueChange={v => setForm({ ...form, variation_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select variation" /></SelectTrigger>
                      <SelectContent position="popper" className="z-[9999]">
                        {variations?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Minimum Cart Value (NPR)</Label>
                <Input type="number" value={form.min_cart_value} onChange={e => setForm({ ...form, min_cart_value: e.target.value })} placeholder="0" />
              </div>

              {form.discount_type === 'percentage' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum Discount Amount (NPR)</Label>
                  <Input type="number" value={form.max_discount_amount} onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="e.g. 500" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active</Label>
              </div>

              <Button onClick={() => saveMutation.mutate()} className="w-full" disabled={!form.code || !form.expiry_date || !form.discount_value}>
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
