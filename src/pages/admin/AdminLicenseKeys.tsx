import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, X, Save, Eye, Pencil, Copy, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const maskKey = (k: string) => {
  if (!k) return '';
  const head = k.slice(0, 5);
  const rest = k.length > 5 ? '*'.repeat(Math.min(k.length - 5, 12)) : '';
  return head + rest;
};

const formatDate = (d: string) => new Date(d).toLocaleString();

const AdminLicenseKeys = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  // Add panel
  const [addOpen, setAddOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [variationId, setVariationId] = useState<string>('none');
  const [keysText, setKeysText] = useState('');
  const [viewLimit, setViewLimit] = useState(1);

  // Edit dialog
  const [editKey, setEditKey] = useState<any | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editLimit, setEditLimit] = useState(1);

  // View dialog
  const [viewKey, setViewKey] = useState<any | null>(null);
  const [viewRemarks, setViewRemarks] = useState('');
  const [revealedValue, setRevealedValue] = useState<string | null>(null);

  // Filter
  const [productFilter, setProductFilter] = useState<string>('all');

  const { data: products } = useQuery({
    queryKey: ['admin-products-license'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: variations } = useQuery({
    queryKey: ['admin-variations-license', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data } = await supabase.from('product_variations').select('id, name').eq('product_id', productId).order('sort_order');
      return data || [];
    },
  });

  const { data: allVariations } = useQuery({
    queryKey: ['admin-all-variations-license'],
    queryFn: async () => {
      const { data } = await supabase.from('product_variations').select('id, name');
      return data || [];
    },
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['admin-license-keys'],
    queryFn: async () => {
      const { data } = await supabase.from('license_keys').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: views } = useQuery({
    queryKey: ['admin-license-key-views'],
    queryFn: async () => {
      const { data } = await supabase.from('license_key_views').select('*').order('viewed_at', { ascending: false });
      return data || [];
    },
  });

  const productMap = useMemo(() => new Map((products || []).map(p => [p.id, p.name])), [products]);
  const variationMap = useMemo(() => new Map((allVariations || []).map(v => [v.id, v.name])), [allVariations]);

  const latestViewByKey = useMemo(() => {
    const m = new Map<string, any>();
    (views || []).forEach(v => { if (!m.has(v.license_key_id)) m.set(v.license_key_id, v); });
    return m;
  }, [views]);

  const filteredKeys = (keys || []).filter(k => productFilter === 'all' || k.product_id === productFilter);
  const fresh = filteredKeys.filter(k => k.status === 'fresh');
  const viewed = filteredKeys.filter(k => k.status === 'viewed');

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error('Product is required');
      const lines = keysText.split('\n').map(s => s.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error('Add at least one key');
      const payload = lines.map(key_value => ({
        product_id: productId,
        variation_id: variationId === 'none' ? null : variationId,
        key_value,
        view_limit: Math.max(1, viewLimit),
      }));
      const { error } = await supabase.from('license_keys').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-license-keys'] });
      toast.success('License keys added');
      setAddOpen(false);
      setKeysText(''); setProductId(''); setVariationId('none'); setViewLimit(1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('license_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-license-keys'] }); toast.success('Key deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editKey) return;
      const { error } = await supabase.from('license_keys').update({
        key_value: editValue,
        view_limit: Math.max(1, editLimit),
      }).eq('id', editKey.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-license-keys'] });
      toast.success('Key updated');
      setEditKey(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const recordViewMutation = useMutation({
    mutationFn: async () => {
      if (!viewKey || !user) throw new Error('Not signed in');
      // Insert view record
      const { error: insErr } = await supabase.from('license_key_views').insert({
        license_key_id: viewKey.id,
        viewed_by: user.id,
        viewed_by_email: user.email || null,
        remarks: viewRemarks || null,
      });
      if (insErr) throw insErr;
      const newCount = (viewKey.view_count || 0) + 1;
      const newStatus = newCount >= viewKey.view_limit ? 'viewed' : 'fresh';
      const { error: upErr } = await supabase.from('license_keys').update({
        view_count: newCount,
        status: newStatus,
      }).eq('id', viewKey.id);
      if (upErr) throw upErr;
      return viewKey.key_value;
    },
    onSuccess: (val) => {
      setRevealedValue(val as string);
      qc.invalidateQueries({ queryKey: ['admin-license-keys'] });
      qc.invalidateQueries({ queryKey: ['admin-license-key-views'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const productLabel = (k: any) => {
    const p = productMap.get(k.product_id) || 'Unknown';
    const v = k.variation_id ? variationMap.get(k.variation_id) : null;
    return v ? `${p} — ${v}` : p;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">License Keys</h2>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Keys</Button>
      </div>

      <Tabs defaultValue="fresh">
        <TabsList>
          <TabsTrigger value="fresh">Fresh Keys ({fresh.length})</TabsTrigger>
          <TabsTrigger value="viewed">Viewed Keys ({viewed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="fresh">
          <div className="border border-border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>View Limit</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                ) : fresh.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No fresh keys</TableCell></TableRow>
                ) : fresh.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="text-foreground">{productLabel(k)}</TableCell>
                    <TableCell className="font-mono text-foreground">{maskKey(k.key_value)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(k.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{k.view_count}/{k.view_limit}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => { setViewKey(k); setViewRemarks(''); setRevealedValue(null); }}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => { setEditKey(k); setEditValue(k.key_value); setEditLimit(k.view_limit); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => { if (confirm('Delete this key?')) deleteMutation.mutate(k.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="viewed">
          <div className="border border-border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Viewed On</TableHead>
                  <TableHead>Viewed By</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>View Limit</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewed.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No viewed keys</TableCell></TableRow>
                ) : viewed.map(k => {
                  const v = latestViewByKey.get(k.id);
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="text-foreground">{productLabel(k)}</TableCell>
                      <TableCell className="font-mono text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{k.key_value}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(k.key_value); toast.success('Copied'); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{v ? formatDate(v.viewed_at) : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{v?.viewed_by_email || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{v?.remarks || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{k.view_count}/{k.view_limit}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => { if (confirm('Delete this key?')) deleteMutation.mutate(k.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Keys Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add License Keys</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-2">
              <div>
                <Label className="text-xs text-muted-foreground">Product *</Label>
                <Select value={productId} onValueChange={(v) => { setProductId(v); setVariationId('none'); }}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Variation</Label>
                <Select value={variationId} onValueChange={setVariationId} disabled={!productId}>
                  <SelectTrigger><SelectValue placeholder="Select variation (optional)" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="none">— None —</SelectItem>
                    {variations?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">License Keys (one per line) *</Label>
                <Textarea
                  value={keysText}
                  onChange={e => setKeysText(e.target.value)}
                  placeholder={'KEY-1111-AAAA\nKEY-2222-BBBB\nKEY-3333-CCCC'}
                  rows={8}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">View Limit per Key *</Label>
                <Input type="number" min={1} value={viewLimit} onChange={e => setViewLimit(parseInt(e.target.value || '1'))} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}><Save className="h-4 w-4 mr-2" />Save Keys</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editKey} onOpenChange={(o) => !o && setEditKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit License Key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Key Value</Label>
              <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">View Limit</Label>
              <Input type="number" min={1} value={editLimit} onChange={e => setEditLimit(parseInt(e.target.value || '1'))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKey(null)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}><Save className="h-4 w-4 mr-2" />Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewKey} onOpenChange={(o) => { if (!o) { setViewKey(null); setRevealedValue(null); setViewRemarks(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>View License Key</DialogTitle></DialogHeader>
          {!revealedValue ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Viewing this key will count against its view limit ({viewKey?.view_count}/{viewKey?.view_limit}).
              </p>
              <div>
                <Label className="text-xs text-muted-foreground">Remarks</Label>
                <Input
                  value={viewRemarks}
                  onChange={e => setViewRemarks(e.target.value)}
                  placeholder="Enter Customer Phone or Order ID"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewKey(null)}>Cancel</Button>
                <Button onClick={() => recordViewMutation.mutate()} disabled={recordViewMutation.isPending}>
                  <Eye className="h-4 w-4 mr-2" />Reveal Key
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">License Key</Label>
                <div className="flex items-center gap-2 mt-1 p-3 bg-muted rounded-md">
                  <span className="font-mono text-foreground flex-1 break-all">{revealedValue}</span>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(revealedValue); toast.success('Copied'); }}>
                    <Copy className="h-3 w-3 mr-1" />Copy
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setViewKey(null); setRevealedValue(null); setViewRemarks(''); }}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLicenseKeys;
