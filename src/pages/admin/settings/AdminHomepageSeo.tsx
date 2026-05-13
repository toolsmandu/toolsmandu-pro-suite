import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';

type WhyItem = { icon: string; title: string; description: string };

const DEFAULT_WHY_ITEMS: WhyItem[] = [
  { icon: 'ShieldCheck', title: '100% Genuine Products', description: 'Only authentic, official subscriptions sourced directly — never cracked or shared illegally.' },
  { icon: 'Zap', title: 'Instant Delivery', description: 'Most products are delivered to your inbox within minutes of payment confirmation.' },
  { icon: 'BadgeCheck', title: 'Service Warranty', description: 'Every order is covered by a full warranty for the duration of your subscription.' },
  { icon: 'Wallet', title: 'Local Payment Methods', description: 'Pay easily with eSewa, Khalti, IME Pay, FonePay, or bank transfer in NPR.' },
  { icon: 'Headphones', title: 'Friendly 24/7 Support', description: 'Our Nepal-based support team is always one WhatsApp message away.' },
  { icon: 'TrendingDown', title: 'Best Prices in Nepal', description: 'Save big with shared family plans and bulk pricing you won\'t find elsewhere.' },
];

const KEYS = [
  'trustpilot_score',
  'trustpilot_count',
  'google_score',
  'google_count',
  'homepage_why_title',
  'homepage_why_intro',
  'homepage_why_items',
  'homepage_why_eyebrow',
] as const;

const ICON_OPTIONS = [
  'ShieldCheck', 'Zap', 'BadgeCheck', 'Wallet', 'Headphones', 'TrendingDown',
  'Award', 'Clock', 'Heart', 'Star', 'Truck', 'CreditCard', 'Lock', 'Gift',
  'Sparkles', 'Rocket', 'CheckCircle2', 'Users', 'ThumbsUp', 'Globe',
  'MessageCircle', 'Phone', 'Mail', 'Tag', 'Percent', 'RefreshCw',
];

const IconPreview = ({ name }: { name: string }) => {
  const I = (Icons as any)[name] || ShieldCheck;
  return <I className="h-4 w-4" />;
};

const AdminHomepageSeo = () => {
  const queryClient = useQueryClient();
  const [tpScore, setTpScore] = useState('4.8');
  const [tpCount, setTpCount] = useState('53');
  const [gScore, setGScore] = useState('4.9');
  const [gCount, setGCount] = useState('120');
  const [whyTitle, setWhyTitle] = useState('WHY CHOOSE TOOLSMANDU');
  const [whyEyebrow, setWhyEyebrow] = useState('Trusted by thousands');
  const [whyIntro, setWhyIntro] = useState('');
  const [whyItems, setWhyItems] = useState<WhyItem[]>(DEFAULT_WHY_ITEMS);

  useQuery({
    queryKey: ['admin-homepage-seo'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key,value').in('key', KEYS as unknown as string[]);
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>) || {};
      setTpScore(map.trustpilot_score || '4.8');
      setTpCount(map.trustpilot_count || '53');
      setGScore(map.google_score || '4.9');
      setGCount(map.google_count || '120');
      setWhyTitle(map.homepage_why_title || 'WHY CHOOSE TOOLSMANDU');
      setWhyEyebrow(map.homepage_why_eyebrow || 'Trusted by thousands');
      setWhyIntro(map.homepage_why_intro || 'Toolsmandu is the trusted destination for genuine digital subscriptions in Nepal. We deliver authentic software, streaming, design, and productivity tools at the best prices — backed by warranty, fast support, and years of proven experience.');
      if (map.homepage_why_items) {
        try {
          const parsed = JSON.parse(map.homepage_why_items);
          if (Array.isArray(parsed) && parsed.length) setWhyItems(parsed);
        } catch {}
      }
      return map;
    },
  });

  const updateItem = (i: number, patch: Partial<WhyItem>) => {
    setWhyItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  };
  const addItem = () => setWhyItems(prev => [...prev, { icon: 'Sparkles', title: 'New Feature', description: 'Describe this benefit.' }]);
  const removeItem = (i: number) => setWhyItems(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    const items = [
      { key: 'trustpilot_score', value: tpScore },
      { key: 'trustpilot_count', value: tpCount },
      { key: 'google_score', value: gScore },
      { key: 'google_count', value: gCount },
      { key: 'homepage_why_title', value: whyTitle },
      { key: 'homepage_why_intro', value: whyIntro },
      { key: 'homepage_why_items', value: JSON.stringify(whyItems) },
    ];
    for (const item of items) {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', item.key).maybeSingle();
      if (existing) await supabase.from('site_settings').update({ value: item.value }).eq('key', item.key);
      else await supabase.from('site_settings').insert(item);
    }
    queryClient.invalidateQueries({ queryKey: ['admin-homepage-seo'] });
    queryClient.invalidateQueries({ queryKey: ['homepage-seo-settings'] });
    queryClient.invalidateQueries({ queryKey: ['homepage-why-choose-us'] });
    toast.success('Homepage SEO content saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Homepage SEO Content</h2>

      <Card className="mb-6">
        <CardHeader><CardTitle>Why Choose Us Section</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Section Title</Label>
            <p className="text-xs text-muted-foreground mb-2">Heading shown in the gradient bar.</p>
            <Input value={whyTitle} onChange={e => setWhyTitle(e.target.value)} placeholder="WHY CHOOSE TOOLSMANDU" />
          </div>
          <div>
            <Label>Intro Paragraph</Label>
            <p className="text-xs text-muted-foreground mb-2">Short description shown below the heading.</p>
            <Textarea value={whyIntro} onChange={e => setWhyIntro(e.target.value)} rows={3} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="font-semibold">Feature Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {whyItems.map((item, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-44">
                      <Label className="text-xs">Icon</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={item.icon}
                        onChange={e => updateItem(i, { icon: e.target.value })}
                      >
                        {ICON_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        Preview: <IconPreview name={item.icon} />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input value={item.title} onChange={e => updateItem(i, { title: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea value={item.description} onChange={e => updateItem(i, { description: e.target.value })} rows={2} />
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label className="font-semibold">Trustpilot Reviews</Label>
              <div><Label className="text-xs">Score (out of 5)</Label><Input value={tpScore} onChange={e => setTpScore(e.target.value)} placeholder="4.8" /></div>
              <div><Label className="text-xs">Number of Reviews</Label><Input value={tpCount} onChange={e => setTpCount(e.target.value)} placeholder="53" /></div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Google Reviews</Label>
              <div><Label className="text-xs">Score (out of 5)</Label><Input value={gScore} onChange={e => setGScore(e.target.value)} placeholder="4.9" /></div>
              <div><Label className="text-xs">Number of Reviews</Label><Input value={gCount} onChange={e => setGCount(e.target.value)} placeholder="120" /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={save} size="lg">Save All Changes</Button>
      </div>
    </div>
  );
};

export default AdminHomepageSeo;
