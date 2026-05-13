import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Plus, Trash2 } from 'lucide-react';

export const SECTION_TYPES = ['hero', 'app_grid', 'features', 'features_faq', 'features_icon_5', 'features_icon_6', 'big_products_cards', 'comparison_two', 'plans', 'pricing_table'] as const;
export type SectionType = typeof SECTION_TYPES[number];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  app_grid: 'App grid',
  features: 'Feature highlights',
  features_faq: 'Features with FAQ Style',
  features_icon_5: '5 Features with icon',
  features_icon_6: '6 Features with icon',
  big_products_cards: 'Big Products Cards',
  comparison_two: 'Comparision of 2',
  plans: 'Pricing Cards',
  pricing_table: 'Pricing & Feature Comparison Table',
};

export const emptySectionData: Record<SectionType, any> = {
  hero: { eyebrow: '', heading: '', subheading: '', cta_label: '', cta_link: '', secondary_cta_label: '', secondary_cta_link: '', bg_color: '' },
  app_grid: { eyebrow: '', heading: '', subheading: '', apps: [], columns: 5 },
  features: { items: [] },
  features_faq: { eyebrow: '', heading: '', description: '', items: [] },
  features_icon_5: { eyebrow: '', heading: '', subheading: '', items: [] },
  features_icon_6: { eyebrow: '', heading: '', subheading: '', columns: 3, items: [] },
  big_products_cards: { eyebrow: '', heading: '', subheading: '', columns: 4, items: [] },
  comparison_two: { eyebrow: '', heading: '', subheading: '', highlight_side: 'right', left: { logo_url: '', label: '', items: [] }, right: { logo_url: '', label: '', items: [] } },
  plans: { eyebrow: '', heading: '', subheading: '', plans: [] },
  pricing_table: { eyebrow: '', heading: '', subheading: '', plans: [], groups: [] },
};

export const buildEmptySection = (type: SectionType) => {
  if (type === 'app_grid') return { ...emptySectionData.app_grid, apps: [] };
  if (type === 'features') return { ...emptySectionData.features, items: [] };
  if (type === 'features_faq') return { heading: '', description: '', items: [] };
  if (type === 'features_icon_5') return { heading: '', subheading: '', items: [] };
  if (type === 'features_icon_6') return { heading: '', subheading: '', columns: 3, items: [] };
  if (type === 'big_products_cards') return { eyebrow: '', heading: '', subheading: '', columns: 4, items: [] };
  if (type === 'comparison_two') return { eyebrow: '', heading: '', subheading: '', highlight_side: 'right', left: { logo_url: '', label: 'Other', items: [] }, right: { logo_url: '', label: '', items: [] } };
  if (type === 'plans') return { ...emptySectionData.plans, plans: [] };
  if (type === 'pricing_table') return { heading: '', plans: [], groups: [] };
  return { ...emptySectionData.hero };
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

const RichField = ({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="mb-1 block text-xs">{label}</Label>
    <RichTextEditor value={value || ''} onChange={onChange} />
  </div>
);

interface SingleProps {
  type: SectionType;
  value: any;
  onChange: (next: any) => void;
  productId?: string;
  availableSections?: Array<{ index: number; name: string; type: SectionType }>;
}

export const SingleSectionEditor = ({ type, value, onChange, productId, availableSections }: SingleProps) => {
  const data = value || buildEmptySection(type);
  const patch = (p: any) => onChange({ ...data, ...p });

  const [variations, setVariations] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    if (!productId || (type !== 'pricing_table' && type !== 'plans')) return;
    supabase
      .from('product_variations')
      .select('id, name')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setVariations((data || []) as any));
  }, [productId, type]);

  const SectionPicker = ({ value: v, onChange: oc }: { value?: string; onChange: (s: string) => void }) => {
    const sections = (availableSections || []).filter((s) => s.type !== 'hero');
    if (sections.length === 0) return null;
    const current = v?.startsWith('#section-') ? v : '';
    return (
      <select
        value={current}
        onChange={(e) => oc(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
      >
        <option value="">— Or jump to a section on this page —</option>
        {sections.map((s) => (
          <option key={s.index} value={`#section-${s.index}`}>
            {s.index}. {s.name}
          </option>
        ))}
      </select>
    );
  };

  if (type === 'hero') {
    return (
      <div className="space-y-3">
        <Field label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <div>
          <Label className="mb-1 block text-xs">Subheading</Label>
          <RichTextEditor value={data.subheading || ''} onChange={(v) => patch({ subheading: v })} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Primary CTA label" value={data.cta_label} onChange={(v) => patch({ cta_label: v })} />
          <div>
            <Field label="Primary CTA link" value={data.cta_link} onChange={(v) => patch({ cta_link: v })} />
            <SectionPicker value={data.cta_link} onChange={(v) => patch({ cta_link: v })} />
          </div>
          <Field label="Secondary CTA label" value={data.secondary_cta_label} onChange={(v) => patch({ secondary_cta_label: v })} />
          <div>
            <Field label="Secondary CTA link" value={data.secondary_cta_link} onChange={(v) => patch({ secondary_cta_link: v })} />
            <SectionPicker value={data.secondary_cta_link} onChange={(v) => patch({ secondary_cta_link: v })} />
          </div>
        </div>
        <Field label="Background (CSS color or gradient, optional)" value={data.bg_color} onChange={(v) => patch({ bg_color: v })} />
      </div>
    );
  }

  if (type === 'app_grid') {
    const apps: any[] = data.apps || [];
    const setApps = (next: any[]) => patch({ apps: next });
    return (
      <div className="space-y-3">
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <div>
          <Label className="mb-1 block text-xs">Apps per row (desktop)</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={data.columns || 5}
            onChange={(e) => patch({ columns: Number(e.target.value) })}
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {apps.map((app, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">App #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => setApps(apps.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Field label="Name" value={app.name} onChange={(v) => setApps(apps.map((a, j) => j === i ? { ...a, name: v } : a))} />
              <div>
                <Label className="mb-1 block text-xs">Icon</Label>
                <ImageUpload value={app.icon_url} onChange={(url) => setApps(apps.map((a, j) => j === i ? { ...a, icon_url: url } : a))} />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setApps([...apps, { name: '', icon_url: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Add app
          </Button>
        </div>
        <div className="pt-2">
          <Label className="mb-1 block text-xs">Footer text (shown below the grid)</Label>
          <RichTextEditor value={data.footer_text || ''} onChange={(v) => patch({ footer_text: v })} />
        </div>
      </div>
    );
  }

  if (type === 'features') {
    const items: any[] = data.items || [];
    const setItems = (next: any[]) => patch({ items: next });
    return (
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-muted-foreground">Feature #{i + 1}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                onClick={() => setItems(items.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Field label="Heading" value={it.heading} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, heading: v } : a))} />
            <RichField label="Description" value={it.description} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, description: v } : a))} />
            <div>
              <Label className="mb-1 block text-xs">Image</Label>
              <ImageUpload value={it.image_url} onChange={(url) => setItems(items.map((a, j) => j === i ? { ...a, image_url: url } : a))} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Image side</Label>
              <select
                value={it.image_side || 'right'}
                onChange={(e) => setItems(items.map((a, j) => j === i ? { ...a, image_side: e.target.value } : a))}
                className="flex h-9 w-32 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setItems([...items, { heading: '', description: '', image_url: '', image_side: 'right' }])}>
          <Plus className="h-4 w-4 mr-1" /> Add feature
        </Button>
      </div>
    );
  }

  if (type === 'features_faq') {
    const items: any[] = data.items || [];
    const setItems = (next: any[]) => patch({ items: next });
    return (
      <div className="space-y-3">
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <RichField label="Description" value={data.description} onChange={(v) => patch({ description: v })} />
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-muted-foreground">FAQ items (click to expand on the live page)</div>
          {items.map((it, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Item #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Field label="Heading" value={it.heading} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, heading: v } : a))} />
              <RichField label="Description" value={it.description} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, description: v } : a))} />
              <div>
                <Label className="mb-1 block text-xs">Image (optional, shown on the left)</Label>
                <ImageUpload value={it.image_url} onChange={(url) => setItems(items.map((a, j) => j === i ? { ...a, image_url: url } : a))} />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { heading: '', description: '', image_url: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Add item
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'features_icon_5') {
    const items: any[] = data.items || [];
    const setItems = (next: any[]) => patch({ items: next });
    return (
      <div className="space-y-3">
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <Field label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-muted-foreground">Feature cards (first card is featured/wider — up to 5 cards)</div>
          {items.map((it, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Card #{i + 1}{i === 0 ? ' (featured)' : ''}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Icon</Label>
                <ImageUpload value={it.icon_url} onChange={(url) => setItems(items.map((a, j) => j === i ? { ...a, icon_url: url } : a))} />
              </div>
              <Field label="Heading" value={it.heading} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, heading: v } : a))} />
              <RichField label="Description" value={it.description} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, description: v } : a))} />
            </div>
          ))}
          {items.length < 5 && (
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { icon_url: '', heading: '', description: '' }])}>
              <Plus className="h-4 w-4 mr-1" /> Add card
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (type === 'big_products_cards') {
    const items: any[] = data.items || [];
    const setItems = (next: any[]) => patch({ items: next });
    return (
      <div className="space-y-3">
        <Field label="Eyebrow (optional)" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
        <Field label="Heading (optional)" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <Field label="Subheading (optional)" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
        <div>
          <Label className="mb-1 block text-xs">Cards per row (desktop)</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={data.columns || 4}
            onChange={(e) => patch({ columns: Number(e.target.value) })}
          >
            {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-muted-foreground">Product cards</div>
          {items.map((it, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Card #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Card image (top hero)</Label>
                <ImageUpload value={it.image_url} onChange={(url) => setItems(items.map((a, j) => j === i ? { ...a, image_url: url } : a))} />
              </div>
              <Field label="Heading" value={it.heading} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, heading: v } : a))} />
              <Field label="Description" value={it.description} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, description: v } : a))} textarea />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { image_url: '', heading: '', description: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Add card
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'comparison_two') {
    const left = data.left || { logo_url: '', label: '', items: [] };
    const right = data.right || { logo_url: '', label: '', items: [] };
    const setSide = (key: 'left' | 'right', next: any) => patch({ [key]: next });

    const renderSide = (key: 'left' | 'right', side: any, defaultLabel: string) => {
      const items: any[] = side.items || [];
      const setItems = (next: any[]) => setSide(key, { ...side, items: next });
      return (
        <div className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground">{defaultLabel} column</div>
          <div>
            <Label className="mb-1 block text-xs">Logo / Icon</Label>
            <ImageUpload value={side.logo_url} onChange={(url) => setSide(key, { ...side, logo_url: url })} />
          </div>
          <Field label="Label (e.g. Other, MS Defender)" value={side.label} onChange={(v) => setSide(key, { ...side, label: v })} />
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Feature rows</div>
            {items.map((it: any, i: number) => (
              <div key={i} className="border border-border/40 rounded p-2 bg-background space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Row #{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Field label="Text" value={it.text} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, text: v } : a))} />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!it.included}
                    onCheckedChange={(checked) => setItems(items.map((a, j) => j === i ? { ...a, included: checked } : a))}
                  />
                  <Label className="text-xs">Included (show check) — off shows cross</Label>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { text: '', included: key === 'right' }])}>
              <Plus className="h-4 w-4 mr-1" /> Add row
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <Field label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <Field label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
        <div>
          <Label className="mb-1 block text-xs">Highlight side (visually emphasized)</Label>
          <select
            value={data.highlight_side || 'right'}
            onChange={(e) => patch({ highlight_side: e.target.value })}
            className="flex h-9 w-40 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {renderSide('left', left, 'Left')}
          {renderSide('right', right, 'Right')}
        </div>
      </div>
    );
  }

  if (type === 'features_icon_6') {
    const items: any[] = data.items || [];
    const setItems = (next: any[]) => patch({ items: next });
    return (
      <div className="space-y-3">
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
        <Field label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
        <div>
          <Label className="mb-1 block text-xs">Columns</Label>
          <select
            value={data.columns ?? 3}
            onChange={(e) => patch({ columns: Number(e.target.value) })}
            className="flex h-9 w-32 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-muted-foreground">Feature cards</div>
          {items.map((it, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Card #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Icon</Label>
                <ImageUpload value={it.icon_url} onChange={(url) => setItems(items.map((a, j) => j === i ? { ...a, icon_url: url } : a))} />
              </div>
              <Field label="Heading" value={it.heading} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, heading: v } : a))} />
              <RichField label="Description" value={it.description} onChange={(v) => setItems(items.map((a, j) => j === i ? { ...a, description: v } : a))} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems([...items, { icon_url: '', heading: '', description: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Add card
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'pricing_table') {
    const ptPlans: any[] = data.plans || [];
    const setPtPlans = (next: any[]) => patch({ plans: next });
    const groups: any[] = data.groups || [];
    const setGroups = (next: any[]) => patch({ groups: next });

    return (
      <div className="space-y-4">
        <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />

        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground">Plan columns</div>
          {ptPlans.map((p, i) => (
            <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground">Plan #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => patch({
                    plans: ptPlans.filter((_, j) => j !== i),
                    groups: groups.map((g) => ({ ...g, rows: (g.rows || []).map((r: any) => ({ ...r, values: (r.values || []).filter((_: any, k: number) => k !== i) })) })),
                  })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <Field label="Name" value={p.name} onChange={(v) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, name: v } : a))} />
                <Field label="Currency prefix (e.g. Rs)" value={p.currency} onChange={(v) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, currency: v } : a))} />
                <Field label="Price" value={p.price} onChange={(v) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, price: v } : a))} />
                <Field label="Period (e.g. mo)" value={p.period} onChange={(v) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, period: v } : a))} />
              </div>
              <Field label="Note (e.g. You pay Rs. X today...)" textarea value={p.note} onChange={(v) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, note: v } : a))} />
              <div>
                <Label className="mb-1 block text-xs">Linked product variation (selected when "Select Plan" is clicked)</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={p.variation_id || ''}
                  onChange={(e) => setPtPlans(ptPlans.map((a, j) => j === i ? { ...a, variation_id: e.target.value } : a))}
                >
                  <option value="">— None —</option>
                  {variations.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {!productId && (
                  <p className="text-[11px] text-muted-foreground mt-1">Open this editor from a product page to load its variations.</p>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => patch({
            plans: [...ptPlans, { name: '', currency: 'Rs', price: '', period: 'mo', note: '' }],
            groups: groups.map((g) => ({ ...g, rows: (g.rows || []).map((r: any) => ({ ...r, values: [...(r.values || []), ''] })) })),
          })}>
            <Plus className="h-4 w-4 mr-1" /> Add plan column
          </Button>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted-foreground">
            Feature groups — use "✓" for a check mark, leave blank for "—".
          </div>
          {groups.map((g, gi) => (
            <div key={gi} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <Input
                  value={g.title || ''}
                  onChange={(e) => setGroups(groups.map((x, j) => j === gi ? { ...x, title: e.target.value } : x))}
                  placeholder="Group title (e.g. Features, Security)"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                  onClick={() => setGroups(groups.filter((_, j) => j !== gi))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {(g.rows || []).map((row: any, ri: number) => (
                  <div key={ri} className="space-y-1 border border-dashed border-border/60 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.label || ''}
                        placeholder="Feature label (e.g. Cloud Storage)"
                        onChange={(e) => setGroups(groups.map((x, j) => j === gi ? { ...x, rows: x.rows.map((r: any, k: number) => k === ri ? { ...r, label: e.target.value } : r) } : x))}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => setGroups(groups.map((x, j) => j === gi ? { ...x, rows: x.rows.filter((_: any, k: number) => k !== ri) } : x))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, ptPlans.length)}, minmax(0, 1fr))` }}>
                      {ptPlans.map((p, pi) => (
                        <Input
                          key={pi}
                          value={(row.values || [])[pi] || ''}
                          placeholder={p.name || `Plan ${pi + 1}`}
                          onChange={(e) => setGroups(groups.map((x, j) => j === gi ? {
                            ...x,
                            rows: x.rows.map((r: any, k: number) => {
                              if (k !== ri) return r;
                              const vals = [...(r.values || [])];
                              while (vals.length < ptPlans.length) vals.push('');
                              vals[pi] = e.target.value;
                              return { ...r, values: vals };
                            })
                          } : x))}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setGroups(groups.map((x, j) => j === gi ? { ...x, rows: [...(x.rows || []), { label: '', values: ptPlans.map(() => '') }] } : x))}>
                  <Plus className="h-4 w-4 mr-1" /> Add row
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setGroups([...groups, { title: 'Features', rows: [] }])}>
            <Plus className="h-4 w-4 mr-1" /> Add group
          </Button>
        </div>
      </div>
    );
  }

  // plans
  const plans: any[] = data.plans || [];
  const setPlans = (next: any[]) => patch({ plans: next });
  return (
    <div className="space-y-3">
      <Field label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
      {plans.map((p, i) => (
        <div key={i} className="border border-border/60 rounded-lg p-3 bg-background/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">Plan #{i + 1}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
              onClick={() => setPlans(plans.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            <Field label="Name" value={p.name} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, name: v } : a))} />
            <Field label="Badge (e.g. Most popular)" value={p.badge} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, badge: v } : a))} />
            <Field label="Price" value={p.price} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, price: v } : a))} />
            <Field label="Period (e.g. month)" value={p.period} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, period: v } : a))} />
            <Field label="CTA label" value={p.cta_label} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, cta_label: v } : a))} />
            <Field label="CTA link (used if no variation linked)" value={p.cta_link} onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, cta_link: v } : a))} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Linked product variation (selected when CTA is clicked)</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={p.variation_id || ''}
              onChange={(e) => setPlans(plans.map((a, j) => j === i ? { ...a, variation_id: e.target.value } : a))}
            >
              <option value="">— None (use CTA link) —</option>
              {variations.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <Field
            label="Features (one per line)"
            textarea
            value={(p.features || []).join('\n')}
            onChange={(v) => setPlans(plans.map((a, j) => j === i ? { ...a, features: v.split('\n') } : a))}
          />
          <div className="flex items-center gap-2">
            <Switch checked={!!p.highlighted} onCheckedChange={(c) => setPlans(plans.map((a, j) => j === i ? { ...a, highlighted: c } : a))} />
            <Label className="text-sm">Highlighted</Label>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setPlans([...plans, { name: '', price: '', period: 'mo', features: [], cta_label: 'Buy now', cta_link: '/cart', highlighted: false }])}>
        <Plus className="h-4 w-4 mr-1" /> Add plan
      </Button>
    </div>
  );
};

export default SingleSectionEditor;
