import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, X } from 'lucide-react';

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sort_order: '0' });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      return data || [];
    },
  });

  const resetForm = () => { setForm({ name: '', slug: '', icon: '', sort_order: '0' }); setEditingId(null); };

  const openAdd = () => { resetForm(); setPanelOpen(true); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, slug: c.slug, icon: c.icon || '', sort_order: String(c.sort_order) });
    setEditingId(c.id);
    setPanelOpen(true);
  };
  const closePanel = () => { setPanelOpen(false); resetForm(); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'), icon: form.icon || null, sort_order: parseInt(form.sort_order) || 0 };
      if (editingId) await supabase.from('categories').update(payload).eq('id', editingId);
      else await supabase.from('categories').insert(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closePanel();
      toast.success(editingId ? 'Updated!' : 'Created!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('categories').delete().eq('id', id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Deleted'); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
      </div>
      <div className={`flex gap-6 ${panelOpen ? 'lg:flex-row-reverse' : ''}`}>
        <div className="flex-1 min-w-0 border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Order</TableHead><TableHead className="w-28">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {categories?.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(`/category/${c.slug}`, '_blank')}><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {panelOpen && (
          <div className="flex-1 border border-border rounded-lg bg-card p-6 self-start">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Edit Category' : 'Add Category'}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closePanel}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
              <Button onClick={() => form.name && saveMutation.mutate()} className="w-full" disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
