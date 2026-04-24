import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Trash2, Loader2, Bell } from 'lucide-react';
import { useState, useMemo } from 'react';

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

interface WaitingRow {
  id: string;
  email: string;
  product_id: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
  products?: { name: string; slug: string; stock_status: string } | null;
}

const AdminWaitingList = () => {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-waiting-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waiting_list')
        .select('id, email, product_id, status, notified_at, created_at, products(name, slug, stock_status)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WaitingRow[];
    },
  });

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    (data || []).forEach((row) => {
      if (row.product_id && row.products?.name) map.set(row.product_id, row.products.name);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const filteredData = useMemo(() => {
    if (productFilter === 'all') return data || [];
    if (productFilter === 'none') return (data || []).filter((r) => !r.product_id);
    return (data || []).filter((r) => r.product_id === productFilter);
  }, [data, productFilter]);

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('waiting_list').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-waiting-list'] });
      toast.success('Entry removed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendNotification = async (row: WaitingRow) => {
    if (!row.products) {
      toast.error('Product not found');
      return;
    }
    setBusyId(row.id);
    try {
      const productUrl = `${window.location.origin}/item/${row.products.slug}`;
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'stock-available',
          recipientEmail: row.email,
          idempotencyKey: `stock-available-${row.id}`,
          templateData: {
            productName: row.products.name,
            productUrl,
          },
        },
      });
      if (error) throw error;

      const { error: upErr } = await supabase
        .from('waiting_list')
        .update({ status: 'notified', notified_at: new Date().toISOString() })
        .eq('id', row.id);
      if (upErr) throw upErr;

      qc.invalidateQueries({ queryKey: ['admin-waiting-list'] });
      toast.success(`Email sent to ${row.email}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send email');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6" /> Waiting List
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customers waiting for out-of-stock products to become available.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Loading...' : `${data?.length || 0} entries`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm py-6 text-center">Loading...</div>
          ) : !data?.length ? (
            <div className="text-muted-foreground text-sm py-12 text-center">
              No customers on the waiting list yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">S/N</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, idx) => {
                  const productInStock = row.products?.stock_status && row.products.stock_status !== 'out_of_stock';
                  const isNotified = row.status === 'notified';
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        {row.products ? (
                          <div>
                            <div className="font-medium">{row.products.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {productInStock ? '✓ In stock' : '✗ Out of stock'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">— deleted —</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isNotified ? (
                          <Badge className="bg-success text-success-foreground">Notified</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500 text-amber-700">
                            Waiting
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendNotification(row)}
                            disabled={busyId === row.id || !row.products}
                          >
                            {busyId === row.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Mail className="h-3 w-3 mr-1" />
                            )}
                            {isNotified ? 'Resend' : 'Send Email'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Remove ${row.email} from waiting list?`)) {
                                deleteEntry.mutate(row.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWaitingList;
