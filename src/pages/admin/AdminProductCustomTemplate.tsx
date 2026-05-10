import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const SECTION_TYPES = ['hero', 'app_grid', 'features', 'plans'] as const;
type SectionType = typeof SECTION_TYPES[number];

const emptyData: Record<SectionType, any> = {
  hero: { eyebrow: '', heading: '', subheading: '', image_url: '', cta_label: '', cta_link: '', secondary_cta_label: '', secondary_cta_link: '', bg_color: '' },
  app_grid: { heading: '', apps: [] },
  features: { items: [] },
  plans: { heading: '', plans: [] },
};

const AdminProductCustomTemplate = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState('default');
  const [sections, setSections] = useState<Record<SectionType, any>>(emptyData);
  const [saving, setSaving] = useState(false);

  const { data: product } = useQuery({
    queryKey: ['admin-product-template', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, custom_template').eq('id', id!).single();
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

  useEffect(() => {
    if (product?.custom_template) setTemplate(product.custom_template);
  }, [product]);

  useEffect(() => {
    if (!existingSections) return;
    const next = { ...emptyData } as Record<SectionType, any>;
    for (const t of SECTION_TYPES) {
      const found = existingSections.find((s: any) => s.section_type === t);
      next[t] = found?.data ? { ...emptyData[t], ...(found.data as any) } : { ...emptyData[t] };
    }
    setSections(next);
  }, [existingSections]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase.from('products').update({ custom_template: template }).eq('id', id);
      if (pErr) throw pErr;

      // upsert each section
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
      toast.success('Template saved');
      queryClient.invalidateQueries({ queryKey: ['admin-product-template', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-sections', id] });
      queryClient.invalidateQueries({ queryKey: ['product-custom-sections', id] });
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (t: SectionType, patch: any) =>
    setSections((p) => ({ ...p, [t]: { ...p[t], ...patch } }));

  const updateApps = (apps: any[]) => updateSection('app_grid', { apps });
  const updateFeatureItems = (items: any[]) => updateSection('features', { items });
  const updatePlans = (plans: any[]) => updateSection('plans', { plans });

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/products"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custom template</h1>
            <p className="text-sm text-muted-foreground">{product?.name}</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <Label className="mb-2 block">Template</Label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="default">Default</option>
          <option value="adobe_style">Adobe style</option>
        </select>
        <p className="text-xs text-muted-foreground mt-2">
          When set to a custom template, the product page renders the custom layout below instead of the default product page.
        </p>
      </div>

      {template === 'adobe_style' && (
        <Accordion type="multiple" defaultValue={['hero']} className="space-y-3">
          {/* HERO */}
          <AccordionItem value="hero" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold">Hero</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Field label="Eyebrow" value={sections.hero.eyebrow} onChange={(v) => updateSection('hero', { eyebrow: v })} />
              <Field label="Heading" value={sections.hero.heading} onChange={(v) => updateSection('hero', { heading: v })} />
              <Field label="Subheading" textarea value={sections.hero.subheading} onChange={(v) => updateSection('hero', { subheading: v })} />
              <div>
                <Label className="mb-1 block text-sm">Hero image</Label>
                <ImageUpload value={sections.hero.image_url} onChange={(url) => updateSection('hero', { image_url: url })} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Primary CTA label" value={sections.hero.cta_label} onChange={(v) => updateSection('hero', { cta_label: v })} />
                <Field label="Primary CTA link" value={sections.hero.cta_link} onChange={(v) => updateSection('hero', { cta_link: v })} />
                <Field label="Secondary CTA label" value={sections.hero.secondary_cta_label} onChange={(v) => updateSection('hero', { secondary_cta_label: v })} />
                <Field label="Secondary CTA link" value={sections.hero.secondary_cta_link} onChange={(v) => updateSection('hero', { secondary_cta_link: v })} />
              </div>
              <Field label="Background (CSS color or gradient, optional)" value={sections.hero.bg_color} onChange={(v) => updateSection('hero', { bg_color: v })} />
            </AccordionContent>
          </AccordionItem>

          {/* APP GRID */}
          <AccordionItem value="app_grid" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold">App grid</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Field label="Heading" value={sections.app_grid.heading} onChange={(v) => updateSection('app_grid', { heading: v })} />
              <div className="space-y-3">
                {(sections.app_grid.apps || []).map((app: any, i: number) => (
                  <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground">App #{i + 1}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => updateApps(sections.app_grid.apps.filter((_: any, j: number) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <Field label="Name" value={app.name} onChange={(v) => updateApps(sections.app_grid.apps.map((a: any, j: number) => j === i ? { ...a, name: v } : a))} />
                      <Field label="Description" value={app.description} onChange={(v) => updateApps(sections.app_grid.apps.map((a: any, j: number) => j === i ? { ...a, description: v } : a))} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">Icon</Label>
                      <ImageUpload value={app.icon_url} onChange={(url) => updateApps(sections.app_grid.apps.map((a: any, j: number) => j === i ? { ...a, icon_url: url } : a))} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateApps([...(sections.app_grid.apps || []), { name: '', icon_url: '', description: '' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Add app
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FEATURES */}
          <AccordionItem value="features" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold">Feature highlights</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              {(sections.features.items || []).map((it: any, i: number) => (
                <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Feature #{i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => updateFeatureItems(sections.features.items.filter((_: any, j: number) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Field label="Heading" value={it.heading} onChange={(v) => updateFeatureItems(sections.features.items.map((a: any, j: number) => j === i ? { ...a, heading: v } : a))} />
                  <Field label="Description" textarea value={it.description} onChange={(v) => updateFeatureItems(sections.features.items.map((a: any, j: number) => j === i ? { ...a, description: v } : a))} />
                  <div>
                    <Label className="mb-1 block text-xs">Image</Label>
                    <ImageUpload value={it.image_url} onChange={(url) => updateFeatureItems(sections.features.items.map((a: any, j: number) => j === i ? { ...a, image_url: url } : a))} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Image side</Label>
                    <select
                      value={it.image_side || 'right'}
                      onChange={(e) => updateFeatureItems(sections.features.items.map((a: any, j: number) => j === i ? { ...a, image_side: e.target.value } : a))}
                      className="flex h-9 w-32 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updateFeatureItems([...(sections.features.items || []), { heading: '', description: '', image_url: '', image_side: 'right' }])}>
                <Plus className="h-4 w-4 mr-1" /> Add feature
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* PLANS */}
          <AccordionItem value="plans" className="bg-card border border-border rounded-lg px-4">
            <AccordionTrigger className="text-base font-semibold">Plans / pricing</AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Field label="Heading" value={sections.plans.heading} onChange={(v) => updateSection('plans', { heading: v })} />
              {(sections.plans.plans || []).map((p: any, i: number) => (
                <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Plan #{i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => updatePlans(sections.plans.plans.filter((_: any, j: number) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <Field label="Name" value={p.name} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, name: v } : a))} />
                    <Field label="Badge (e.g. Most popular)" value={p.badge} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, badge: v } : a))} />
                    <Field label="Price" value={p.price} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, price: v } : a))} />
                    <Field label="Period (e.g. month)" value={p.period} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, period: v } : a))} />
                    <Field label="CTA label" value={p.cta_label} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, cta_label: v } : a))} />
                    <Field label="CTA link" value={p.cta_link} onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, cta_link: v } : a))} />
                  </div>
                  <Field
                    label="Features (one per line)"
                    textarea
                    value={(p.features || []).join('\n')}
                    onChange={(v) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, features: v.split('\n').map((s) => s.trim()).filter(Boolean) } : a))}
                  />
                  <div className="flex items-center gap-2">
                    <Switch checked={!!p.highlighted} onCheckedChange={(c) => updatePlans(sections.plans.plans.map((a: any, j: number) => j === i ? { ...a, highlighted: c } : a))} />
                    <Label className="text-sm">Highlighted</Label>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => updatePlans([...(sections.plans.plans || []), { name: '', price: '', period: 'mo', features: [], cta_label: 'Buy now', cta_link: '/cart', highlighted: false }])}>
                <Plus className="h-4 w-4 mr-1" /> Add plan
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, textarea }: { label: string; value?: string; onChange: (v: string) => void; textarea?: boolean }) => (
  <div>
    <Label className="mb-1 block text-xs">{label}</Label>
    {textarea ? (
      <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} />
    ) : (
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default AdminProductCustomTemplate;
