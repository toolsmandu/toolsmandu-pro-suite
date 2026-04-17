import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertTriangle, Copy, Check } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLIC_URL = `${SUPABASE_URL}/functions/v1/robots-txt`;

const AdminRobotsTxt = () => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Robots.txt</h2>

      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important: Custom domain requires manual sync</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>
            Search engines fetch <code className="bg-muted px-1 rounded">robots.txt</code> from your
            custom domain (<code className="bg-muted px-1 rounded">web.toolsmandu.com/robots.txt</code>),
            which serves the <strong>static file</strong> at <code className="bg-muted px-1 rounded">public/robots.txt</code> — not the database.
          </p>
          <p className="font-semibold">To make your changes live on your custom domain:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Edit and save the content below.</li>
            <li>Click <strong>Copy content</strong>.</li>
            <li>Open <code className="bg-muted px-1 rounded">public/robots.txt</code> in the Lovable editor and paste the content.</li>
            <li>Republish the project.</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Edit robots.txt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Live on custom domain (static): </span>
              <a
                href="https://web.toolsmandu.com/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="underline text-primary break-all"
              >
                https://web.toolsmandu.com/robots.txt
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Dynamic preview (database): </span>
              <a
                href={PUBLIC_URL}
                target="_blank"
                rel="noreferrer"
                className="underline text-primary break-all"
              >
                {PUBLIC_URL}
              </a>
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
            rows={20}
            className="font-mono text-sm"
            placeholder="User-agent: *&#10;Allow: /"
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || isLoading}>
              {saving ? 'Saving...' : 'Save Robots.txt'}
            </Button>
            <Button variant="outline" onClick={copyToClipboard} disabled={!content}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy content'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRobotsTxt;
