import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface FreeTool {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tool_info: string | null;
  tool_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const empty: Partial<FreeTool> = {
  name: '', slug: '', description: '', tool_info: '', tool_description: '',
  meta_title: '', meta_description: '', meta_keywords: '', image_url: '',
};

const AdminFreeTools = () => {
  const [tools, setTools] = useState<FreeTool[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<FreeTool>>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from('free_tools').select('*').order('sort_order').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setTools((data as FreeTool[]) || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditingId(null); setOpen(true); };
  const openEdit = (t: FreeTool) => { setForm(t); setEditingId(t.id); setOpen(true); };

  const setField = (k: keyof FreeTool, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: !editingId && (!f.slug || f.slug === slugify(f.name || '')) ? slugify(v) : f.slug,
    }));
  };

  const save = async () => {
    if (!form.name?.trim() || !form.slug?.trim()) {
      toast({ title: 'Name and slug are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const payload = {
      name: form.name!.trim(),
      slug: slugify(form.slug!),
      description: form.description || null,
      tool_info: form.tool_info || null,
      tool_description: form.tool_description || null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      meta_keywords: form.meta_keywords || null,
    };
    const { error } = editingId
      ? await supabase.from('free_tools').update(payload).eq('id', editingId)
      : await supabase.from('free_tools').insert(payload);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Tool updated' : 'Tool created' });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    const { error } = await supabase.from('free_tools').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); load(); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Free Tools</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage free tools for your customers.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Tool</Button>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          No free tools yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {tools.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">/{t.slug}</div>
                {t.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.description}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tool Name *</Label>
                <Input value={form.name || ''} onChange={(e) => onNameChange(e.target.value)} />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug || ''} onChange={(e) => setField('slug', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description || ''} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div>
              <Label>Tool Info</Label>
              <Textarea rows={2} value={form.tool_info || ''} onChange={(e) => setField('tool_info', e.target.value)} placeholder="Short info shown below the title" />
            </div>
            <div>
              <Label>Tool Description</Label>
              <Textarea rows={4} value={form.tool_description || ''} onChange={(e) => setField('tool_description', e.target.value)} placeholder="Full description shown below the tool" />
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-semibold mb-2 text-foreground">SEO</p>
              <div className="space-y-3">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={form.meta_title || ''} onChange={(e) => setField('meta_title', e.target.value)} />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea rows={2} value={form.meta_description || ''} onChange={(e) => setField('meta_description', e.target.value)} />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <Input value={form.meta_keywords || ''} onChange={(e) => setField('meta_keywords', e.target.value)} placeholder="comma, separated, keywords" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">Tool's script will be generated by Lovable later.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={loading}>{editingId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFreeTools;
