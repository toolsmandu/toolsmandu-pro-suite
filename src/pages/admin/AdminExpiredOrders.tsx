import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

type Filter = 'expired' | 'expiring_soon' | 'all';

const AdminExpiredOrders = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('expired');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['expired-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, created_at, completed_at, user_id,
          profiles:user_id ( email, phone ),
          order_items (
            id, variation_name,
            products ( name ),
            product_variations ( expiry_days )
          )
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Flatten one row per order_item that has expiry_days
      const flat: any[] = [];
      (data || []).forEach((o: any) => {
        (o.order_items || []).forEach((it: any) => {
          const expiryDays = it.product_variations?.expiry_days;
          if (!expiryDays || !o.completed_at) return;
          const completed = new Date(o.completed_at);
          const expiry = new Date(completed);
          expiry.setDate(expiry.getDate() + expiryDays);
          const diffMs = expiry.getTime() - today.getTime();
          const remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          flat.push({
            key: `${o.id}-${it.id}`,
            orderNumber: o.order_number || o.id.slice(0, 8),
            email: o.profiles?.email || '-',
            phone: o.profiles?.phone || '-',
            product: `${it.products?.name || 'Product'}${it.variation_name ? ` - ${it.variation_name}` : ''}`,
            createdAt: o.created_at,
            expiryDate: expiry.toISOString(),
            remaining,
            status: o.status,
          });
        });
      });
      return flat;
    },
  });

  const filtered = useMemo(() => {
    let list = rows || [];
    if (filter === 'expired') list = list.filter(r => r.remaining <= 0);
    else if (filter === 'expiring_soon') list = list.filter(r => r.remaining > 0 && r.remaining <= 7);
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(r =>
        (r.email || '').toLowerCase().includes(term) ||
        (r.phone || '').toLowerCase().includes(term) ||
        (r.orderNumber || '').toLowerCase().includes(term) ||
        (r.product || '').toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => a.remaining - b.remaining);
  }, [rows, filter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-foreground">Expired Orders</h2>
        <p className="text-sm text-muted-foreground">
          Completed orders with a variation expiry. Expiry = order completed date + variation expiry days.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, phone, order #, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expired">Expired only</SelectItem>
            <SelectItem value="expiring_soon">Expiring in 7 days</SelectItem>
            <SelectItem value="all">All completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Remaining Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No orders found.</TableCell></TableRow>
            )}
            {filtered.map(r => {
              const isExpired = r.remaining <= 0;
              const isSoon = r.remaining > 0 && r.remaining <= 7;
              return (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.orderNumber}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell className="text-sm">{r.phone}</TableCell>
                  <TableCell className="text-sm">{r.product}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.expiryDate)}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${isExpired ? 'text-destructive' : isSoon ? 'text-warning' : 'text-foreground'}`}>
                      {r.remaining}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isExpired ? 'bg-destructive/20 text-destructive' : isSoon ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                      {isExpired ? 'Expired' : isSoon ? 'Expiring soon' : 'Active'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminExpiredOrders;
