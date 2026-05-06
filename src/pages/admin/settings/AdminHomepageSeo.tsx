import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { toast } from 'sonner';

const KEYS = [
  'homepage_seo_title',
  'homepage_about_content',
  'homepage_seo_content',
  'trustpilot_score',
  'trustpilot_count',
  'google_score',
  'google_count',
] as const;

const AdminHomepageSeo = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('What is Toolsmandu? Why Toolsmandu?');
  const [aboutContent, setAboutContent] = useState('');
  const [seoContent, setSeoContent] = useState('');
  const [tpScore, setTpScore] = useState('4.8');
  const [tpCount, setTpCount] = useState('53');
  const [gScore, setGScore] = useState('4.9');
  const [gCount, setGCount] = useState('120');

  useQuery({
    queryKey: ['admin-homepage-seo'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key,value').in('key', KEYS as unknown as string[]);
      const map = data?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>) || {};
      setTitle(map.homepage_seo_title || 'What is Toolsmandu? Why Toolsmandu?');
      setAboutContent(map.homepage_about_content || '');
      setSeoContent(map.homepage_seo_content || '');
      setTpScore(map.trustpilot_score || '4.8');
      setTpCount(map.trustpilot_count || '53');
      setGScore(map.google_score || '4.9');
      setGCount(map.google_count || '120');
      return map;
    },
  });

  const save = async () => {
    const items = [
      { key: 'homepage_about_content', value: aboutContent },
      { key: 'homepage_seo_content', value: seoContent },
      { key: 'trustpilot_score', value: tpScore },
      { key: 'trustpilot_count', value: tpCount },
      { key: 'google_score', value: gScore },
      { key: 'google_count', value: gCount },
    ];
    for (const item of items) {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', item.key).maybeSingle();
      if (existing) await supabase.from('site_settings').update({ value: item.value }).eq('key', item.key);
      else await supabase.from('site_settings').insert(item);
    }
    queryClient.invalidateQueries({ queryKey: ['admin-homepage-seo'] });
    queryClient.invalidateQueries({ queryKey: ['homepage-seo-settings'] });
    toast.success('Homepage SEO content saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Homepage SEO Content</h2>
      <Card>
        <CardHeader><CardTitle>"What is Toolsmandu? Why Toolsmandu?"</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>About Content</Label>
            <p className="text-xs text-muted-foreground mb-2">Shown below the Blogs section on the homepage.</p>
            <RichTextEditor value={aboutContent} onChange={setAboutContent} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <Label>Additional SEO Content</Label>
            <p className="text-xs text-muted-foreground mb-2">Long-form SEO copy shown below the "What is Toolsmandu?" section.</p>
            <RichTextEditor value={seoContent} onChange={setSeoContent} />
          </div>

          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomepageSeo;
