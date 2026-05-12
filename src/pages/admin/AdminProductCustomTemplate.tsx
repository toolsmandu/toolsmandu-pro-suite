import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { SingleSectionEditor, SECTION_LABELS, SectionType, buildEmptySection } from '@/components/admin/TemplateSectionsEditor';
import SectionPreview from '@/components/admin/SectionPreview';

interface LayoutItem {
  id?: string;
  template_id: string;
  name: string;
  template_type: SectionType;
  data: any;
  open?: boolean;
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
        .select('id, template_id, sort_order, data, custom_templates(id, name, template_type, data)')
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
        .select('id, name, template_type, data')
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
        .map((r: any) => {
          const t = r.custom_templates.template_type as SectionType;
          const itemData = r.data && Object.keys(r.data).length > 0
            ? r.data
            : (r.custom_templates.data || buildEmptySection(t));
          return {
            id: r.id,
            template_id: r.template_id,
            name: r.custom_templates.name,
            template_type: t,
            data: { ...buildEmptySection(t), ...itemData },
            open: true,
          };
        })
    );
  }, [existing]);

  const addSection = () => {
    if (!picker) return;
    const sec = (sections || []).find((s: any) => s.id === picker);
    if (!sec) return;
    const t = sec.template_type as SectionType;
    setItems((cur) => [
      ...cur,
      {
        template_id: sec.id,
        name: sec.name,
        template_type: t,
        data: { ...buildEmptySection(t), ...((sec.data as any) || {}) },
        open: true,
      },
    ]);
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
  const toggle = (idx: number) =>
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, open: !it.open } : it)));
  const updateData = (idx: number, next: any) =>
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, data: next } : it)));

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
          data: it.data || {},
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
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
            <option value="">Pick a section type…</option>
            {(sections || []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {SECTION_LABELS[s.template_type as SectionType] || s.template_type}
              </option>
            ))}
          </select>
          <Button onClick={addSection} disabled={!picker}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The library's content is used as a starting point, then you can edit it just for this product. <Link to="/admin/layout-section" className="underline">Manage sections</Link>.
        </p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground">No sections yet. Add some from above.</p>
          </div>
        ) : (
          items.map((it, i) => (
            <div key={`${it.template_id}-${i}`} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-border bg-background/50">
                <button onClick={() => toggle(i)} className="text-muted-foreground hover:text-foreground">
                  {it.open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
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
              {it.open && (
                <div className="grid lg:grid-cols-2 gap-4 p-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Content for this product</h3>
                    <SingleSectionEditor
                      type={it.template_type}
                      value={it.data}
                      onChange={(next) => updateData(i, next)}
                      productId={id}
                      availableSections={items.map((s, idx) => ({ index: idx + 1, name: s.name, type: s.template_type }))}
                    />
                  </div>
                  <div className="lg:sticky lg:top-4 self-start">
                    <SectionPreview type={it.template_type} data={it.data} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProductCustomTemplate;
