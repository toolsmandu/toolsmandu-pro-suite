import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import TemplateSectionsEditor, { buildEmptySections, SECTION_TYPES, SectionType } from '@/components/admin/TemplateSectionsEditor';

const AdminProductCustomTemplate = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState('default');
  const [sections, setSections] = useState<Record<SectionType, any>>(buildEmptySections());
  const [saving, setSaving] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['admin-product-template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, custom_template, use_custom_layout').eq('id', id!).single();
      return data;
    },
  });

  const { data: existingSections } = useQuery({
    queryKey: ['admin-product-sections', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('product_custom_sections').select('*').eq('product_id', id!);
      return data || [];
    },
  });

  const { data: masterTemplates } = useQuery({
    queryKey: ['custom-templates-list'],
    queryFn: async () => {
      const { data } = await supabase.from('custom_templates').select('id, name, data').order('name');
      return data || [];
    },
  });

  useEffect(() => {
    if (product?.custom_template) setTemplate(product.custom_template);
  }, [product]);

  useEffect(() => {
    if (!existingSections) return;
    const empty = buildEmptySections();
    const next = { ...empty } as Record<SectionType, any>;
    for (const t of SECTION_TYPES) {
      const found = existingSections.find((s: any) => s.section_type === t);
      next[t] = found?.data ? { ...empty[t], ...(found.data as any) } : { ...empty[t] };
    }
    setSections(next);
  }, [existingSections]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase.from('products').update({ custom_template: template }).eq('id', id);
      if (pErr) throw pErr;

      for (let i = 0; i < SECTION_TYPES.length; i++) {
        const t = SECTION_TYPES[i];
        const { error } = await supabase
          .from('product_custom_sections')
          .upsert(
            { product_id: id, section_type: t, data: sections[t], sort_order: i, is_active: true },
            { onConflict: 'product_id,section_type' }
          );
        if (error) throw error;
      }
      toast.success('Layout saved');
      queryClient.invalidateQueries({ queryKey: ['admin-product-template', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-sections', id] });
      queryClient.invalidateQueries({ queryKey: ['product-custom-sections', id] });
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadFromTemplate = (templateId: string) => {
    if (!templateId) return;
    const tpl = (masterTemplates || []).find((t: any) => t.id === templateId);
    if (!tpl) return;
    if (!confirm(`Load content from "${tpl.name}"? This will replace your current section content (you still need to save).`)) return;
    const data = (tpl.data || {}) as any;
    const empty = buildEmptySections();
    setSections({
      hero: { ...empty.hero, ...(data.hero || {}) },
      app_grid: { ...empty.app_grid, ...(data.app_grid || {}) },
      features: { ...empty.features, ...(data.features || {}) },
      plans: { ...empty.plans, ...(data.plans || {}) },
    });
    setTemplate('adobe_style');
    toast.success(`Loaded "${tpl.name}". Click Save to apply.`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
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
          "Use Custom Layout on Frontend" is currently disabled for this product. Enable it on the product edit page for this layout to be visible to customers.
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5 mb-6 grid md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-2 block">Template</Label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="adobe_style">Adobe style</option>
          </select>
        </div>
        <div>
          <Label className="mb-2 block">Load content from a master template</Label>
          <select
            onChange={(e) => { loadFromTemplate(e.target.value); e.target.value = ''; }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Pick a template to copy from…</option>
            {(masterTemplates || []).map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Loads content into the editor below. Edits stay product-specific after saving.</p>
        </div>
      </div>

      {template === 'adobe_style' && (
        <TemplateSectionsEditor value={sections} onChange={setSections} />
      )}
    </div>
  );
};

export default AdminProductCustomTemplate;
