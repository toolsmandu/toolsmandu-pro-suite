import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Search, Check, ChevronsUpDown, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';
import CopyButton from '@/components/admin/CopyButton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const AdminCustomerSegment = () => {
  const [productFilter, setProductFilter] = useState<string>('all');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: products } = useQuery({
    queryKey: ['cs-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ['customer-segment'],
    queryFn: async () => {
      // Fetch orders with profile + items (only product_id needed)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, user_id, created_at,
          profiles:user_id ( email, phone, created_at ),
          order_items ( product_id, products ( name ) )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Group by user, collect product ids and product names
      const map = new Map<string, any>();
      (data || []).forEach((o: any) => {
        if (!o.user_id) return;
        const productIds = new Set<string>((o.order_items || []).map((i: any) => i.product_id).filter(Boolean));
        const productNames = new Set<string>((o.order_items || []).map((i: any) => i.products?.name).filter(Boolean));
        const existing = map.get(o.user_id);
        if (existing) {
          productIds.forEach((p) => existing.productIds.add(p));
          productNames.forEach((p) => existing.productNames.add(p));
        } else {
          map.set(o.user_id, {
            userId: o.user_id,
            email: o.profiles?.email || '',
            phone: o.profiles?.phone || '',
            joinedAt: o.profiles?.created_at || null,
            productIds,
            productNames,
          });
        }
      });
      return Array.from(map.values());
    },
  });

  const filtered = useMemo(() => {
    let list = rows || [];
    if (productFilter !== 'all') {
      list = list.filter((r: any) => r.productIds.has(productFilter));
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((r: any) =>
        (r.email || '').toLowerCase().includes(term) ||
        (r.phone || '').toLowerCase().includes(term)
      );
    }
    return list.sort((a: any, b: any) => {
      const ta = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const tb = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return tb - ta;
    });
  }, [rows, productFilter, search]);

  const selectedProductName = useMemo(() => {
    if (productFilter === 'all') return 'All products';
    return products?.find((p) => p.id === productFilter)?.name || 'All products';
  }, [productFilter, products]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('No customers to export');
      return;
    }
    const data = filtered.map((r: any) => ({
      'Email': r.email,
      'Phone': r.phone,
      'Joined': r.joinedAt ? new Date(r.joinedAt).toISOString() : '',
      'Products Purchased': Array.from(r.productNames).join(', '),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Segment');
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(wb, `customer-segment-${ts}.xlsx`);
    toast.success(`Exported ${filtered.length} customers`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">Customer Segment</h2>
        <p className="text-sm text-muted-foreground">
          Customers grouped by the products they have purchased.
          {productFilter !== 'all' && <> Showing customers who bought <span className="text-foreground font-medium">{selectedProductName}</span>.</>}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full sm:w-[280px] justify-between">
              <span className="truncate">{selectedProductName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search product..." />
              <CommandList>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => { setProductFilter('all'); setProductPopoverOpen(false); }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', productFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                    All products
                  </CommandItem>
                  {(products || []).map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => { setProductFilter(p.id); setProductPopoverOpen(false); }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', productFilter === p.id ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{p.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export Data
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} customer(s)</div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Products Purchased</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No customers found.</TableCell></TableRow>
            )}
            {filtered.map((r: any) => (
              <TableRow key={r.userId}>
                <TableCell className="text-foreground">
                  <span>{r.email || '-'}</span>
                  <CopyButton value={r.email} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span>{r.phone || '-'}</span>
                  <CopyButton value={r.phone} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.joinedAt ? formatDate(r.joinedAt) : '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{Array.from(r.productNames).join(', ') || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCustomerSegment;
