import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, X, Save, Search, Pencil, Check, ChevronsUpDown, Copy, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface PromoForm {
  product_id: string;
  code: string;
  remarks: string;
  instruction_template: string;
}

const emptyForm = (): PromoForm => ({
  product_id: '',
  code: '',
  remarks: '',
  instruction_template: '',
});

const AdminPromoCodes = () => {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm());
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products-list-promo'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').order('name');
      return data || [];
    },
  });

  const productMap = new Map((products || []).map(p => [p.id, p.name]));

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setPanelOpen(true);
  };

  const openEdit = (pc: any) => {
    setForm({
      product_id: pc.product_id,
      code: pc.code,
      remarks: pc.remarks || '',
      instruction_template: pc.instruction_template || '',
    });
    setEditingId(pc.id);
    setPanelOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.product_id || !form.code) throw new Error('Product and Promo Code are required');
      const payload = {
        product_id: form.product_id,
        code: form.code.trim(),
        remarks: form.remarks || null,
        instruction_template: form.instruction_template || '',
      };
      if (editingId) {
        const { error } = await supabase.from('promo_codes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promo_codes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success(editingId ? 'Promo code updated!' : 'Promo code created!');
      setPanelOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Promo code deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (promoCodes || []).filter(pc => {
    if (productFilter !== 'all' && pc.product_id !== productFilter) return false;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const productName = productMap.get(pc.product_id) || '';
    return pc.code.toLowerCase().includes(term) || productName.toLowerCase().includes(term);
  });

  const previewHtml = (form.instruction_template || '').split('{code}').join(form.code || '{code}');

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      <div className={`${panelOpen ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Promo Codes</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search promo codes" className="pl-9 w-56" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-56 justify-between font-normal">
                  <span className="truncate">
                    {productFilter === 'all' ? 'All Products' : (productMap.get(productFilter) || 'Select product')}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 z-[9999]" align="end">
                <Command>
                  <CommandInput placeholder="Search products..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="All Products" onSelect={() => setProductFilter('all')}>
                        <Check className={cn('mr-2 h-4 w-4', productFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                        All Products
                      </CommandItem>
                      {products?.map(p => (
                        <CommandItem key={p.id} value={p.name} onSelect={() => setProductFilter(p.id)}>
                          <Check className={cn('mr-2 h-4 w-4', productFilter === p.id ? 'opacity-100' : 'opacity-0')} />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Promo Code</Button>
          </div>
        </div>

        {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-10rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(pc => (
                  <TableRow key={pc.id} className={`cursor-pointer ${editingId === pc.id && panelOpen ? 'bg-muted/50' : ''}`} onClick={() => openEdit(pc)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-foreground">{pc.code}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(pc.code);
                            toast.success('Promo code copied');
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const tpl = (pc.instruction_template || '').split('{code}').join(pc.code);
                            const tmp = document.createElement('div');
                            tmp.innerHTML = tpl;
                            const text = tmp.innerText || tmp.textContent || '';
                            navigator.clipboard.writeText(text);
                            toast.success('Instructions copied');
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" /> Copy Instructions
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{productMap.get(pc.product_id) || <span className="text-muted-foreground italic">Unknown</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{pc.remarks || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(pc); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this promo code?')) deleteMutation.mutate(pc.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No promo codes yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="w-full lg:w-[560px] lg:min-w-[560px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">{editingId ? 'Edit Promo Code' : 'Add Promo Code'}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Product *</Label>
                <Select value={form.product_id} onValueChange={v => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Promo Code *</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. WELCOME50" className="font-mono" />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Remarks</Label>
                <Input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes" />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Instruction Template</Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Use <code className="px-1 py-0.5 bg-muted rounded">{'{code}'}</code> as a placeholder — it will be replaced with the actual promo code value when displayed.
                </p>
                <RichTextEditor
                  value={form.instruction_template}
                  onChange={v => setForm({ ...form, instruction_template: v })}
                />
              </div>

              {form.instruction_template && (
                <div>
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div
                    className="mt-1 p-3 border border-border rounded-md bg-muted/30 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}

              <Button onClick={() => saveMutation.mutate()} className="w-full" disabled={!form.product_id || !form.code || saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Promo Code' : 'Create Promo Code'}
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
