import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { SECTION_LABELS, SectionType } from '@/components/admin/TemplateSectionsEditor';

interface LayoutItem {
  id?: string;
  template_id: string;
  name: string;
  template_type: SectionType;
}

const AdminProductCustomTemplate = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [picker, setPicker] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['admin-product-template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, use_custom_layout').eq('id', id!).single();
      return data;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ['admin-product-layout-items', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('product_layout_items')
        .select('id, template_id, sort_order, custom_templates(id, name, template_type)')
        .eq('product_id', id!)
        .order('sort_order');
      return data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['layout-sections-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('custom_templates')
        .select('id, name, template_type')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  useEffect(() => {
    if (!existing) return;
    setItems(
      existing
        .filter((r: any) => r.custom_templates)
        .map((r: any) => ({
          id: r.id,
          template_id: r.template_id,
          name: r.custom_templates.name,
          template_type: r.custom_templates.template_type,
        }))
    );
  }, [existing]);

  const addSection = () => {
    if (!picker) return;
    const sec = (sections || []).find((s: any) => s.id === picker);
    if (!sec) return;
    setItems((cur) => [...cur, { template_id: sec.id, name: sec.name, template_type: sec.template_type as SectionType }]);
    setPicker('');
  };

  const remove = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    setItems((cur) => {
      const next = [...cur];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error: delErr } = await supabase.from('product_layout_items').delete().eq('product_id', id);
      if (delErr) throw delErr;
      if (items.length > 0) {
        const rows = items.map((it, i) => ({
          product_id: id,
          template_id: it.template_id,
          sort_order: i,
        }));
        const { error: insErr } = await supabase.from('product_layout_items').insert(rows);
        if (insErr) throw insErr;
      }
      toast.success('Layout saved');
      queryClient.invalidateQueries({ queryKey: ['admin-product-layout-items', id] });
      queryClient.invalidateQueries({ queryKey: ['product-layout-items', id] });
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/products"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custom layout</h1>
            <p className="text-sm text-muted-foreground">{product?.name}</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {!product?.use_custom_layout && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg p-3 mb-4 text-sm">
          "Use Custom Layout on Frontend" is currently disabled for this product. Enable it on the product edit page for this layout to be visible.
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-base font-semibold mb-3">Add a section</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={picker}
            onChange={(e) => setPicker(e.target.value)}
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Pick a section from your library…</option>
            {(sections || []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} — {SECTION_LABELS[s.template_type as SectionType] || s.template_type}
              </option>
            ))}
          </select>
          <Button onClick={addSection} disabled={!picker}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Don't see what you need? <Link to="/admin/layout-section" className="underline">Manage sections</Link>.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-base font-semibold mb-3">Sections on this product</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sections yet. Add some from above.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={`${it.template_id}-${i}`} className="flex items-center gap-2 border border-border/60 rounded-lg p-3 bg-background/50">
                <div className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{it.name}</div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {SECTION_LABELS[it.template_type] || it.template_type}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductCustomTemplate;
