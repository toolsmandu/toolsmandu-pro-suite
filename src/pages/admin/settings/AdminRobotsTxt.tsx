import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLIC_URL = `${SUPABASE_URL}/functions/v1/robots-txt`;

const AdminRobotsTxt = () => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-robots-txt'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'robots_txt')
        .maybeSingle();
      return data?.value || '';
    },
  });

  useEffect(() => {
    if (typeof data === 'string') setContent(data);
  }, [data]);

  const save = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'robots_txt')
      .maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value: content }).eq('key', 'robots_txt');
    } else {
      await supabase.from('site_settings').insert({ key: 'robots_txt', value: content });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-robots-txt'] });
    setSaving(false);
    toast.success('Robots.txt saved!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Robots.txt</h2>
      <Card>
        <CardHeader>
          <CardTitle>Edit robots.txt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Served dynamically at:{' '}
            <a
              href={PUBLIC_URL}
              target="_blank"
              rel="noreferrer"
              className="underline text-primary break-all"
            >
              {PUBLIC_URL}
            </a>
            . To use this on your domain, set up a redirect/proxy from <code>/robots.txt</code> to that URL,
            or replace your static <code>public/robots.txt</code> contents periodically.
          </p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            rows={20}
            className="font-mono text-sm"
            placeholder="User-agent: *&#10;Allow: /"
          />
          <Button onClick={save} disabled={saving || isLoading}>
            {saving ? 'Saving...' : 'Save Robots.txt'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRobotsTxt;
